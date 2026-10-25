"""
app/services/pinturas_service.py
Carga de la pintura del pintor: cifrado AES-256-GCM, consentimiento firmado con ECDSA
y sobres de llave para los jueces. Todo ocurre en el backend; antes vivia en el worker.
"""
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Final, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import app.repositories.jurado_repository as jurado_repository
import app.repositories.pinturas_repository as pinturas_repository
import app.repositories.pintores_repository as pintores_repository
from app.exceptions.custom_exceptions import (
    ArchivoDemasiadoGrandeException,
    ArchivoInvalidoException,
    ConfiguracionJuradoIncompletaException,
    PinturaYaExistenteException,
    RecursoNoEncontradoException,
    SesionCriptograficaExpiradaException,
)
from app.models.evaluacion import EstadoEvaluacion
from app.models.pintura import Pintura
from app.models.sobrellave import SobreLlave
from app.schemas.pintor_schemas import MisObrasResponse, PerfilPintorResponse, PinturaResponse
from app.services.key_vault import boveda_pintores
from app.utils import crypto

logger = logging.getLogger(__name__)

TORNEO: Final[str] = os.getenv("TORNEO_NOMBRE", "Torneo Internacional ArtClash Pro 2026")
TOTAL_SLOTS: Final[int] = 1  # una pintura por pintor (Pintura.pintor_id es unico)
NUM_JUECES: Final[int] = 3
MAX_BYTES: Final[int] = int(os.getenv("MAX_UPLOAD_MB", "50")) * 1024 * 1024
MAX_PALABRAS_DESCRIPCION: Final[int] = 500
STORAGE_DIR: Final[str] = os.getenv("STORAGE_DIR", "storage/pinturas_cifradas")

os.makedirs(STORAGE_DIR, exist_ok=True)


# --------------------------------------------------------------------------- #
# Utilidades
# --------------------------------------------------------------------------- #
def _detectar_mime(datos: bytes) -> Optional[str]:
    """Tipo de imagen segun los magic bytes (no se confia en el Content-Type del cliente)."""
    if datos.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if datos.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if datos[:4] == b"RIFF" and datos[8:12] == b"WEBP":
        return "image/webp"
    return None


def _llave_privada_de_sesion(payload_token: dict) -> str:
    jti: Optional[str] = payload_token.get("jti")
    privada: Optional[str] = boveda_pintores.obtener(jti) if jti else None
    if privada is None:
        raise SesionCriptograficaExpiradaException(
            "Tu llave privada no esta cargada en esta sesion (por ejemplo, el servidor se reinicio). "
            "Vuelve a subir tu archivo .pem."
        )
    return privada


def _estado(pintura: Pintura) -> str:
    evaluaciones = pintura.evaluaciones
    if evaluaciones and all(e.estado == EstadoEvaluacion.PUBLICADO for e in evaluaciones):
        return "Evaluada"
    return "En Evaluación"


def _a_response(pintura: Pintura) -> PinturaResponse:
    return PinturaResponse(
        id=pintura.id,
        slot=1,
        total_slots=TOTAL_SLOTS,
        titulo=pintura.titulo,
        descripcion=pintura.descripcion,
        estado=_estado(pintura),
        hash_pintura_cifrada=pintura.hash_pintura_cifrada,
        firma_consentimiento=pintura.firma_consentimiento,
    )


def _ruta_absoluta(ruta_relativa: str) -> str:
    base = os.path.realpath(STORAGE_DIR)
    ruta = os.path.realpath(os.path.join(base, ruta_relativa))
    if not ruta.startswith(base + os.sep):
        raise RecursoNoEncontradoException("Archivo no encontrado")
    return ruta


# --------------------------------------------------------------------------- #
# Casos de uso
# --------------------------------------------------------------------------- #
def obtener_perfil(db: Session, payload_token: dict) -> PerfilPintorResponse:
    pintor = pintores_repository.find_by_id(db, uuid.UUID(payload_token["sub"]))
    if pintor is None:
        raise RecursoNoEncontradoException("Pintor no encontrado")
    return PerfilPintorResponse(
        nombre=pintor.nombre,
        seudonimo=pintor.seudonimo,
        torneo=TORNEO,
        foto_perfil=pintor.foto_perfil,
    )


def listar_mis_obras(db: Session, payload_token: dict) -> MisObrasResponse:
    pintura = pinturas_repository.find_by_pintor(db, uuid.UUID(payload_token["sub"]))
    return MisObrasResponse(
        total_slots=TOTAL_SLOTS,
        obras=[_a_response(pintura)] if pintura else [],
    )


def cargar_pintura(
    db: Session,
    payload_token: dict,
    contenido: bytes,
    titulo: str,
    descripcion: str,
) -> PinturaResponse:
    id_pintor = uuid.UUID(payload_token["sub"])

    # --- 1. Validaciones previas (baratas) ---------------------------------- #
    pintor = pintores_repository.find_by_id(db, id_pintor)
    if pintor is None:
        raise RecursoNoEncontradoException("Pintor no encontrado")
    if pinturas_repository.find_by_pintor(db, id_pintor) is not None:
        raise PinturaYaExistenteException("Ya registraste tu pintura; no hay slots disponibles.")

    titulo = titulo.strip()
    descripcion = descripcion.strip()
    if not (3 <= len(titulo) <= 120):
        raise ArchivoInvalidoException("El titulo debe tener entre 3 y 120 caracteres.")
    if not descripcion or len(descripcion.split()) > MAX_PALABRAS_DESCRIPCION:
        raise ArchivoInvalidoException(
            f"La memoria descriptiva es obligatoria y admite maximo {MAX_PALABRAS_DESCRIPCION} palabras."
        )
    if not contenido:
        raise ArchivoInvalidoException("El archivo esta vacio.")
    if len(contenido) > MAX_BYTES:
        raise ArchivoDemasiadoGrandeException(
            f"El archivo supera el maximo de {MAX_BYTES // (1024 * 1024)} MB."
        )
    mime = _detectar_mime(contenido)
    if mime is None:
        raise ArchivoInvalidoException("Formato no soportado. Sube una imagen PNG, JPG o WEBP.")

    jueces = jurado_repository.find_jueces(db)
    if len(jueces) != NUM_JUECES:
        logger.error("Se esperaban %d jueces y hay %d", NUM_JUECES, len(jueces))
        raise ConfiguracionJuradoIncompletaException(
            "El jurado aun no esta configurado; intenta mas tarde."
        )

    privada_pem = _llave_privada_de_sesion(payload_token)

    # --- 2. Cifrar la pintura con una K_AES fresca -------------------------- #
    id_pintura = uuid.uuid4()
    llave_aes: bytes = crypto.generar_llave_aes()
    paquete: bytes = crypto.cifrar_aes_gcm(llave_aes, contenido, crypto.aad_obra(str(id_pintura)))
    hash_cifrado: str = crypto.sha256_hex(paquete)

    # --- 3. Documento de consentimiento firmado con ECDSA ------------------- #
    documento: str = json.dumps(
        {
            "tipo": "consentimiento_participacion",
            "version": 1,
            "id_pintura": str(id_pintura),
            "id_pintor": str(id_pintor),
            "algoritmo_cifrado": "AES-256-GCM",
            "hash_sha256_pintura_cifrada": hash_cifrado,
            "fecha_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "declaracion": "Certifico la autoria humana de la obra y autorizo su exhibicion.",
        },
        sort_keys=True, separators=(",", ":"), ensure_ascii=False,
    )
    firma_hex: str = crypto.firmar_ecdsa(privada_pem, documento.encode("utf-8"))

    # Autoverificacion: la firma debe validar contra la publica registrada en la BD
    if not crypto.verificar_ecdsa(pintor.clave_publica_ecdsa, documento.encode("utf-8"), firma_hex):
        logger.error("La llave de sesion no coincide con la publica del pintor %s", id_pintor)
        raise SesionCriptograficaExpiradaException("La llave de la sesion no coincide con tu llave publica registrada.")

    # --- 4. Sobres: uno por juez (RSA-OAEP) y uno para el propio pintor ----- #
    sobres = [
        SobreLlave(
            id_pintura=id_pintura,
            id_jurado=juez.id,
            llave_aes_cifrada=crypto.envolver_llave_para_juez(
                llave_aes, juez.clave_publica_rsa, str(id_pintura)
            ),
        )
        for juez in jueces
    ]
    sobre_pintor: str = crypto.envolver_llave_para_pintor(llave_aes, privada_pem, str(id_pintura))
    del llave_aes  # a partir de aqui K_AES solo existe cifrada

    # --- 5. Persistir: archivo cifrado en disco + filas en una transaccion --- #
    nombre_archivo = f"{id_pintura}.bin"
    ruta_disco = _ruta_absoluta(nombre_archivo)
    with open(ruta_disco, "wb") as f:
        f.write(paquete)

    pintura = Pintura(
        id=id_pintura,
        pintor_id=id_pintor,
        titulo=titulo,
        descripcion=descripcion,
        ruta_pintura_cifrada=nombre_archivo,
        mime_type=mime,
        hash_pintura_cifrada=hash_cifrado,
        llave_aes_pintor_cifrada=sobre_pintor,
        documento_consentimiento=documento,
        firma_consentimiento=firma_hex,
    )
    try:
        pinturas_repository.save_con_sobres(db, pintura, sobres)
    except IntegrityError:
        db.rollback()
        os.remove(ruta_disco)
        raise PinturaYaExistenteException("Ya registraste tu pintura; no hay slots disponibles.")
    except Exception:
        db.rollback()
        os.remove(ruta_disco)
        raise

    pintura = pinturas_repository.find_by_pintor(db, id_pintor)
    return _a_response(pintura)


def obtener_imagen_del_dueno(db: Session, payload_token: dict, id_pintura: uuid.UUID) -> tuple[bytes, str]:
    """Descifra la obra para su propio dueno (requiere la llave de su sesion)."""
    pintura = pinturas_repository.find_by_id(db, id_pintura)
    # 404 tambien si es de otro pintor: no revelamos que existe
    if pintura is None or str(pintura.pintor_id) != payload_token["sub"]:
        raise RecursoNoEncontradoException("Pintura no encontrada")

    privada_pem = _llave_privada_de_sesion(payload_token)
    try:
        llave_aes = crypto.desenvolver_llave_para_pintor(
            pintura.llave_aes_pintor_cifrada, privada_pem, str(pintura.id)
        )
        with open(_ruta_absoluta(pintura.ruta_pintura_cifrada), "rb") as f:
            paquete = f.read()
        claro = crypto.descifrar_aes_gcm(llave_aes, paquete, crypto.aad_obra(str(pintura.id)))
    except (ValueError, FileNotFoundError):
        logger.error("No se pudo descifrar la pintura %s (archivo alterado o ausente)", pintura.id)
        raise RecursoNoEncontradoException("No se pudo recuperar la imagen.")
    return claro, pintura.mime_type
