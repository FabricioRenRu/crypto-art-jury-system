"""
app/utils/almacenamiento.py
Guarda y lee archivos del backend en un solo lugar, organizados por carpeta:
  pinturas/<id>.bin      -> paquetes cifrados (nonce || AES-256-GCM || tag)
  avatares/<uuid>.<ext>  -> fotos de perfil

  STORAGE_BACKEND=local -> disco, dentro de STORAGE_DIR (desarrollo)
  STORAGE_BACKEND=gcs   -> bucket de Cloud Storage (producción)
"""
import os
import re
from functools import lru_cache
from typing import Final

BACKEND: Final[str] = os.getenv("STORAGE_BACKEND", "local")
STORAGE_DIR: Final[str] = os.getenv("STORAGE_DIR", "storage")
GCS_BUCKET: Final[str] = os.getenv("GCS_BUCKET", "")

# Solo nombres tipo "carpeta/archivo.ext": sin "..", sin rutas absolutas ni caracteres raros
_NOMBRE_VALIDO: Final[re.Pattern[str]] = re.compile(r"^[a-z]+/[A-Za-z0-9._-]+$")


class ArchivoNoEncontrado(Exception):
    """El archivo no existe en el almacenamiento."""


@lru_cache(maxsize=1)
def _bucket():
    # Se importa aquí para que en desarrollo (local) no haga falta configurar Google Cloud
    from google.cloud import storage
    if not GCS_BUCKET:
        raise RuntimeError("Falta GCS_BUCKET en el .env")
    # En la VM se autentica sola con la cuenta de servicio (no hay llaves en el código)
    return storage.Client().bucket(GCS_BUCKET)


def _validar_nombre(nombre: str) -> None:
    if not _NOMBRE_VALIDO.fullmatch(nombre) or ".." in nombre:
        raise ArchivoNoEncontrado(nombre)


def _ruta_local(nombre: str) -> str:
    _validar_nombre(nombre)
    base = os.path.realpath(STORAGE_DIR)
    ruta = os.path.realpath(os.path.join(base, nombre))
    if not ruta.startswith(base + os.sep):  # doble candado contra rutas tipo ../../
        raise ArchivoNoEncontrado(nombre)
    return ruta


def guardar(nombre: str, datos: bytes, content_type: str = "application/octet-stream") -> None:
    if BACKEND == "gcs":
        _validar_nombre(nombre)
        _bucket().blob(nombre).upload_from_string(datos, content_type=content_type)
        return
    ruta = _ruta_local(nombre)
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "wb") as f:
        f.write(datos)


def leer(nombre: str) -> bytes:
    if BACKEND == "gcs":
        from google.api_core.exceptions import NotFound
        _validar_nombre(nombre)
        try:
            return _bucket().blob(nombre).download_as_bytes()
        except NotFound as exc:
            raise ArchivoNoEncontrado(nombre) from exc
    try:
        with open(_ruta_local(nombre), "rb") as f:
            return f.read()
    except FileNotFoundError as exc:
        raise ArchivoNoEncontrado(nombre) from exc


def borrar(nombre: str) -> None:
    """Se usa para deshacer una subida si falla la base de datos."""
    if BACKEND == "gcs":
        from google.api_core.exceptions import NotFound
        _validar_nombre(nombre)
        try:
            _bucket().blob(nombre).delete()
        except NotFound:
            pass
        return
    try:
        os.remove(_ruta_local(nombre))
    except (FileNotFoundError, ArchivoNoEncontrado):
        pass