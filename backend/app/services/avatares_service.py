"""
app/services/avatares_service.py
Fotos de perfil de los pintores: validación, guardado y lectura.
Se guardan con app/utils/almacenamiento en la carpeta "avatares/" (disco en local, bucket en la nube).
La URL pública sigue siendo /static/avatars/<archivo>, así el frontend y la BD no cambian.
"""
import base64
import binascii
import re
import uuid
from typing import Final, Optional

from app.exceptions.custom_exceptions import (
    ArchivoDemasiadoGrandeException,
    ArchivoInvalidoException,
    RecursoNoEncontradoException,
)
from app.utils import almacenamiento

CARPETA: Final[str] = "avatares"
PREFIJO_URL: Final[str] = "/static/avatars/"
MAX_FOTO_BYTES: Final[int] = 2 * 1024 * 1024

# MIME del data URL -> extensión que se guarda
FORMATOS_FOTO: Final[dict[str, str]] = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
# Extensión -> MIME con el que se sirve
MIME_POR_EXTENSION: Final[dict[str, str]] = {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}

# Nombre de archivo válido: <uuid4>.<png|jpg|webp>
_NOMBRE_AVATAR: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$")


def guardar_foto_perfil(data_url: Optional[str]) -> Optional[str]:
    """
    Valida la foto (solo PNG/JPG/WEBP, máx. 2 MB, contenido real) y la guarda.
    Regresa la ruta pública (/static/avatars/<archivo>) o None si no mandaron foto.
    """
    if not data_url:
        return None
    cabecera, _, data_b64 = data_url.partition(",")
    if not (cabecera.startswith("data:") and cabecera.endswith(";base64")):
        raise ArchivoInvalidoException("La foto de perfil no es válida.")
    mime = cabecera[len("data:"):-len(";base64")]
    extension = FORMATOS_FOTO.get(mime)
    if extension is None:
        raise ArchivoInvalidoException("La foto debe ser PNG, JPG o WEBP.")
    if len(data_b64) > MAX_FOTO_BYTES * 4 // 3 + 4:
        raise ArchivoDemasiadoGrandeException("La foto supera los 2 MB.")
    try:
        datos = base64.b64decode(data_b64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ArchivoInvalidoException("La foto de perfil no es válida.") from exc

    # "Números mágicos": que el contenido sea realmente la imagen que dice ser
    es_valida = (
        (extension == "png" and datos.startswith(b"\x89PNG\r\n\x1a\n"))
        or (extension == "jpg" and datos.startswith(b"\xff\xd8\xff"))
        or (extension == "webp" and datos[:4] == b"RIFF" and datos[8:12] == b"WEBP")
    )
    if not es_valida:
        raise ArchivoInvalidoException("El contenido de la foto no corresponde a su formato.")

    nombre_archivo = f"{uuid.uuid4()}.{extension}"
    almacenamiento.guardar(f"{CARPETA}/{nombre_archivo}", datos, content_type=MIME_POR_EXTENSION[extension])
    return f"{PREFIJO_URL}{nombre_archivo}"


def borrar_foto_perfil(ruta_publica: Optional[str]) -> None:
    """Deshace el guardado si el registro del pintor falla después de subir la foto."""
    if ruta_publica and ruta_publica.startswith(PREFIJO_URL):
        almacenamiento.borrar(f"{CARPETA}/{ruta_publica[len(PREFIJO_URL):]}")


def leer_foto_perfil(nombre_archivo: str) -> tuple[bytes, str]:
    """Regresa (bytes, MIME) de un avatar. Solo acepta nombres <uuid>.<ext> generados por nosotros."""
    coincidencia = _NOMBRE_AVATAR.fullmatch(nombre_archivo)
    if coincidencia is None:
        raise RecursoNoEncontradoException("Foto no encontrada")
    try:
        datos = almacenamiento.leer(f"{CARPETA}/{nombre_archivo}")
    except almacenamiento.ArchivoNoEncontrado as exc:
        raise RecursoNoEncontradoException("Foto no encontrada") from exc
    return datos, MIME_POR_EXTENSION[coincidencia.group(1)]