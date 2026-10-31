"""
/app/services/evaluation_service.py
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.schemas.evaluacion_schemas import *
import app.repositories.pinturas_repository as pinturas_repository
import app.repositories.evaluaciones_repository as evaluaciones_repository
import app.repositories.jurado_repository as jurado_repository
import app.services.presidente_service as presidente_service
from app.exceptions.custom_exceptions import *
from app.models.evaluacion import Evaluacion, EstadoEvaluacion
import logging
from typing import Optional, List
import uuid
from app.utils import crypto

logger: logging.Logger = logging.getLogger(__name__)

def _llave_presidente(db: Session) -> str:
    return presidente_service.obtener_llave_publica(db).clave_publica_rsa


def guardar_hash_evaluaciones(db: Session, payload: HashedEvaluationCreate, juez_id: uuid.UUID) -> HashedEvaluationResponse:
    """
    Funcion para guardar el hash de la evaluacion del juez, este hash luego lo usara el presidente
    para hacer la firma ciega
    """
    # Verificar que existe un sobre de juez (la pintura fue asignada)
    if pinturas_repository.find_sobre(db, payload.id_pintura, juez_id) is None:
        raise RecursoNoEncontradoException("Esta pintura no está asignada a este juez.")
     
    if evaluaciones_repository.find_by_pintura_and_juez(db, payload.id_pintura, juez_id):
        raise EvaluacionYaExistenteException("Ya existe una evaluación en curso para esta pintura y este juez.")
    
    if not crypto.numero_en_rango(payload.hash_cegado, _llave_presidente(db)):
        raise FirmaInvalidaException("El hash cegado no es válido para la llave del presidente.")
    
    if not crypto.es_base64(payload.evaluacion_cifrada):
        raise FirmaInvalidaException("La evaluación cifrada no está en base64.")
    
    # Crear instancia/registro de evaluacion
    nueva: Evaluacion = Evaluacion(
        id_pintura=payload.id_pintura,
        id_jurado=juez_id,
        hash_cegado=payload.hash_cegado,
        evaluacion_cifrada=payload.evaluacion_cifrada,
        estado=EstadoEvaluacion.ESPERANDO_FIRMA
    )

    try:
        nueva = evaluaciones_repository.save(db, nueva)
    except IntegrityError:
        db.rollback()
        raise EvaluacionYaExistenteException("Ya existe una evaluación para esta pintura y este juez.")
    

    return HashedEvaluationResponse(id=nueva.id)



def obtener_hashes_pendientes(db: Session) -> List[HashPendiente]:
    """Devuelve la bandeja de sobres opacos listos para firma."""
    pendientes: List[Evaluacion] = evaluaciones_repository.get_pendientes_firma(db)

    # Transformamos el modelo de SQLAlchemy al esquema de Pydantic
    return [
        HashPendiente(
            id_evaluacion=str(ev.id), 
            hash_cegado=ev.hash_cegado
        ) 
        for ev in pendientes
    ]


def procesar_firmas_masivas(db: Session, firmas: List[FirmaCiegaCreate]) -> int:
    """Aplica todas las firmas del lote en una sola transacción, verificando cada una."""
    ids = [f.id_evaluacion for f in firmas]
    if len(set(ids)) != len(ids):
        raise EvaluacionNoFirmableException("El lote contiene evaluaciones repetidas.")


    llave_presidente: str = _llave_presidente(db)
    try:
        for firma in firmas:
            evaluacion: Evaluacion = evaluaciones_repository.find_by_id(db, firma.id_evaluacion)
            if evaluacion is None:
                raise RecursoNoEncontradoException(f"La evaluación {firma.id_evaluacion} no existe.")
            if evaluacion.estado != EstadoEvaluacion.ESPERANDO_FIRMA:
                raise EvaluacionNoFirmableException(
                    f"La evaluación {firma.id_evaluacion} ya fue procesada o está en un estado inválido."
                )
            
            # s'^e mod n == h' : la firma realmente corresponde a ese voto cegado
            if not crypto.verificar_firma_ciega(evaluacion.hash_cegado, firma.firma_ciega_presi, llave_presidente):
                raise FirmaInvalidaException(
                    f"La firma ciega de {firma.id_evaluacion} no corresponde a su hash cegado."
                )
            evaluaciones_repository.update_firma_ciega(evaluacion, firma.firma_ciega_presi)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return len(firmas)
    

def listar_mis_evaluaciones(db: Session, juez_id: uuid.UUID) -> MisEvaluacionesResponse:
    """
    Funcion para que el juez pueda consultar sus evaluaciones
    (y recoge s' y su evaluación cifrada)
    """
    return MisEvaluacionesResponse(
        evaluaciones=[
            MiEvaluacionResponse(
                id_evaluacion=ev.id,
                id_pintura=ev.id_pintura,
                estado=ev.estado.value,
                firma_ciega_presi=ev.firma_ciega_presi,
                evaluacion_cifrada=ev.evaluacion_cifrada,
            )
            for ev in evaluaciones_repository.find_by_juez(db, juez_id)
        ]
    )


def publicar_evaluacion(db: Session, payload: PublicarEvaluacionRequest, juez_id: uuid.UUID) -> PublicarEvaluacionResponse:
    """
    Funcion para que el juez publique su evaluacion.
    El servidor verifica las 2 firmas antes de aceptar
    """
    evaluacion: Optional[Evaluacion] = evaluaciones_repository.find_by_pintura_and_juez(db, payload.id_pintura, juez_id)
    if evaluacion is None:
        raise RecursoNoEncontradoException("No tienes una evaluación para esta pintura.")
    if evaluacion.estado != EstadoEvaluacion.FIRMADO:
        raise EvaluacionNoFirmableException(
            "La evaluación aún no tiene la firma del presidente o ya fue publicada."
        )

    juez = jurado_repository.find_by_id(db, juez_id)
    
    if juez is None or not juez.clave_publica_rsa:
        raise RecursoNoEncontradoException("No se encontró la llave pública del juez.")

    # El servidor reconstruye el texto con sus propios datos 
    texto = crypto.texto_evaluacion_canonico(
        payload.id_pintura, juez_id, payload.estrellas, payload.comentario
    ).encode("utf-8")

    firma_presidente_ok, h = crypto.verificar_firma_presidente(texto, payload.firma_descegada, _llave_presidente(db))
    if not firma_presidente_ok:
        raise FirmaInvalidaException("La firma del presidente no corresponde a esta evaluación.")
    if not crypto.verificar_pss(juez.clave_publica_rsa, texto, payload.firma_juez):
        raise FirmaInvalidaException("La firma RSA-PSS del juez no es válida.")

    evaluaciones_repository.publicar(
        db,
        evaluacion,
        estrellas=payload.estrellas,
        comentario=payload.comentario.strip(),
        hash_original=str(h),
        firma_juez=payload.firma_juez,
        firma_descegada=payload.firma_descegada,
    )
    logger.info("Evaluación %s publicada", evaluacion.id)
    return PublicarEvaluacionResponse(id_evaluacion=evaluacion.id, estado=evaluacion.estado.value)