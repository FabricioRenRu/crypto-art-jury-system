
from app.models.evaluacion import Evaluacion, EstadoEvaluacion
from sqlalchemy.orm import Session, joinedload, selectinload
from uuid import UUID
from app.models.pintura import Pintura
from typing import Optional, List

def save(db: Session, db_evaluacion: Evaluacion) -> Evaluacion:
    db.add(db_evaluacion)
    db.commit()
    db.refresh(db_evaluacion)

    return db_evaluacion

def find_by_pintura_and_juez(db: Session, id_pintura: UUID, id_juez: UUID) -> Optional[Evaluacion]:
    return(
        db.query(Evaluacion)
        .filter(Evaluacion.id_pintura == id_pintura)
        .filter(Evaluacion.id_jurado == id_juez)
        .first()
    )


def get_pendientes_firma(db: Session) -> List[Evaluacion]:
    """Obtiene todas las evaluaciones que no han sido firmadas por el presidente."""
    return db.query(Evaluacion).filter(
        Evaluacion.estado == EstadoEvaluacion.ESPERANDO_FIRMA
    ).all()


def find_by_id(db: Session, evaluacion_id: UUID) -> Evaluacion:
    """Busca una evaluación específica por su ID."""
    return db.query(Evaluacion).filter(Evaluacion.id == evaluacion_id).first()

def find_by_juez(db: Session, id_juez: UUID) -> List[Evaluacion]:
    """Todas las evaluaciones de un juez ."""
    return db.query(Evaluacion).filter(Evaluacion.id_jurado == id_juez).all()


def update_firma_ciega(evaluacion: Evaluacion, firma_ciega: str) -> None:
    """Aplica la firma del presidente; el commit lo hace el servicio (todo o nada)."""
    evaluacion.firma_ciega_presi = firma_ciega
    evaluacion.estado = EstadoEvaluacion.FIRMADO


def find_publicadas(db: Session) -> List[Evaluacion]:
    """Evaluaciones publicadas con su pintura, pintor, sobres y juez (para el tablero público)."""
    return (
        db.query(Evaluacion)
        .options(
            joinedload(Evaluacion.pintura).joinedload(Pintura.pintor),
            joinedload(Evaluacion.pintura).selectinload(Pintura.sobres),
            joinedload(Evaluacion.juez),
        )
        .filter(Evaluacion.estado == EstadoEvaluacion.PUBLICADO)
        .all()
    )


def publicar(
    db: Session,
    evaluacion: Evaluacion,
    estrellas: int,
    comentario: str,
    hash_original: str,
    firma_juez: str,
    firma_descegada: str,
) -> Evaluacion:
    """Paso 9: guarda la evaluación en claro con sus dos firmas y la marca como PUBLICADO."""
    evaluacion.estrellas = estrellas
    evaluacion.comentarios = comentario
    evaluacion.hash_original = hash_original
    evaluacion.firma_del_juez = firma_juez
    evaluacion.firma_descegada = firma_descegada
    evaluacion.evaluacion_cifrada = None  # ya no hace falta: la evaluación es pública
    evaluacion.estado = EstadoEvaluacion.PUBLICADO
    db.commit()
    db.refresh(evaluacion)
    return evaluacion
     