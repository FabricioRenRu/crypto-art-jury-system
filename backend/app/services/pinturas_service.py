"""Persistencia de pinturas cifradas y verificación del consentimiento del pintor."""
import json
import logging
import os
import uuid
from typing import Final

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import app.repositories.pinturas_repository as pinturas_repository
import app.repositories.pintores_repository as pintores_repository
from app.exceptions.custom_exceptions import (
    ArchivoDemasiadoGrandeException,
    ArchivoInvalidoException,
    PinturaYaExistenteException,
    RecursoNoEncontradoException,
)
from app.models.evaluacion import EstadoEvaluacion
from app.models.pintura import Pintura
from app.schemas.pintor_schemas import MisObrasResponse, PerfilPintorResponse, PinturaResponse
from app.utils import crypto

logger = logging.getLogger(__name__)

TORNEO: Final[str] = os.getenv("TORNEO_NOMBRE", "Torneo Internacional ArtClash Pro 2026")
TOTAL_SLOTS: Final[int] = 1  # una pintura por pintor (Pintura.pintor_id es unico)
MAX_BYTES: Final[int] = int(os.getenv("MAX_UPLOAD_MB", "50")) * 1024 * 1024
MAX_PALABRAS_DESCRIPCION: Final[int] = 500
STORAGE_DIR: Final[str] = os.getenv("STORAGE_DIR", "storage/pinturas_cifradas")

os.makedirs(STORAGE_DIR, exist_ok=True)


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
        tipo_mime=pintura.mime_type,
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
    id_pintura: uuid.UUID,
    mime: str,
    tamano_original: int,
    documento: str,
    firma_hex: str,
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
    if pinturas_repository.find_by_id(db, id_pintura) is not None:
        raise ArchivoInvalidoException("El identificador de la pintura ya está en uso.")

    titulo = titulo.strip()
    descripcion = descripcion.strip()
    if not (3 <= len(titulo) <= 120):
        raise ArchivoInvalidoException("El titulo debe tener entre 3 y 120 caracteres.")
    if not descripcion or len(descripcion.split()) > MAX_PALABRAS_DESCRIPCION:
        raise ArchivoInvalidoException(
            f"La memoria descriptiva es obligatoria y admite maximo {MAX_PALABRAS_DESCRIPCION} palabras."
        )
    if mime not in {"image/png", "image/jpeg", "image/webp"}:
        raise ArchivoInvalidoException("Formato no soportado. Sube una imagen PNG, JPG o WEBP.")
    if tamano_original <= 0:
        raise ArchivoInvalidoException("El archivo está vacío.")
    if tamano_original > MAX_BYTES:
        raise ArchivoDemasiadoGrandeException(
            f"El archivo supera el maximo de {MAX_BYTES // (1024 * 1024)} MB."
        )
    if len(contenido) > MAX_BYTES + crypto.LONGITUD_NONCE + crypto.LONGITUD_TAG:
        raise ArchivoDemasiadoGrandeException(
            f"El archivo supera el maximo de {MAX_BYTES // (1024 * 1024)} MB."
        )
    if len(contenido) != tamano_original + crypto.LONGITUD_NONCE + crypto.LONGITUD_TAG:
        raise ArchivoInvalidoException("El paquete cifrado no coincide con el tamaño de la imagen.")

    try:
        consentimiento = json.loads(documento)
        if (
            consentimiento.get("tipo") != "consentimiento_participacion"
            or consentimiento.get("version") != 1
            or consentimiento.get("id_pintura") != str(id_pintura)
            or consentimiento.get("id_pintor") != str(id_pintor)
            or consentimiento.get("algoritmo_cifrado") != "AES-256-GCM"
            or consentimiento.get("hash_sha256_pintura_cifrada") != crypto.sha256_hex(contenido)
            or not isinstance(consentimiento.get("fecha_utc"), str)
            or consentimiento.get("declaracion")
            != "Certifico la autoria humana de la obra y autorizo su exhibicion."
        ):
            raise ValueError("Los datos del consentimiento no coinciden con la pintura.")
        if not crypto.verificar_ecdsa(
            pintor.clave_publica_ecdsa, documento.encode("utf-8"), firma_hex
        ):
            raise ValueError("La firma ECDSA no es válida para esta cuenta.")
    except (json.JSONDecodeError, AttributeError, TypeError, ValueError) as exc:
        raise ArchivoInvalidoException(
            "El consentimiento es inválido o no corresponde a la pintura."
        ) from exc

    hash_cifrado = crypto.sha256_hex(contenido)

    # --- Persistir el archivo cifrado y su consentimiento ------------------- #
    nombre_archivo = f"{id_pintura}.bin"
    ruta_disco = _ruta_absoluta(nombre_archivo)
    with open(ruta_disco, "wb") as f:
        f.write(contenido)

    pintura = Pintura(
        id=id_pintura,
        pintor_id=id_pintor,
        titulo=titulo,
        descripcion=descripcion,
        ruta_pintura_cifrada=nombre_archivo,
        mime_type=mime,
        hash_pintura_cifrada=hash_cifrado,
        documento_consentimiento=documento,
        firma_consentimiento=firma_hex,
    )
    try:
        pinturas_repository.save(db, pintura)
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


def obtener_imagen_cifrada_del_dueno(
    db: Session, payload_token: dict, id_pintura: uuid.UUID
) -> bytes:
    """Devuelve al dueño el paquete cifrado; el cliente lo descifra con su llave de sesión."""
    pintura = pinturas_repository.find_by_id(db, id_pintura)
    # 404 tambien si es de otro pintor: no revelamos que existe
    if pintura is None or str(pintura.pintor_id) != payload_token["sub"]:
        raise RecursoNoEncontradoException("Pintura no encontrada")

    try:
        with open(_ruta_absoluta(pintura.ruta_pintura_cifrada), "rb") as f:
            return f.read()
    except FileNotFoundError as exc:
        logger.error("No se encontró el paquete cifrado de la pintura %s", pintura.id)
        raise RecursoNoEncontradoException("No se pudo recuperar la imagen.") from exc
