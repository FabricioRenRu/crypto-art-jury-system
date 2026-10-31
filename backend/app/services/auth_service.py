import app.repositories.pintores_repository as pintores_repository
import app.repositories.jurado_repository as jurado_repository
from sqlalchemy.orm import Session
from app.schemas.pintor_schemas import PintorCreate, PintorResponse
from app.exceptions.custom_exceptions import EmailYaRegistradoException, CredencialesInvalidasException
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.models.pintor import Pintor
from app.models.jurado import Jurado
from typing import Any, Optional
import os
import base64
import uuid
import logging
from app.exceptions.custom_exceptions import SeudonimoYaRegistradoException
from app.exceptions.custom_exceptions import ArchivoInvalidoException, ArchivoDemasiadoGrandeException
import binascii

logger = logging.getLogger(__name__)

# Carpeta para guardar las fotos de Perfil
os.makedirs("static/avatars", exist_ok=True)

FORMATOS_FOTO = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
MAX_FOTO_BYTES = 2 * 1024 * 1024


def _guardar_foto_perfil(data_url: Optional[str]) -> Optional[str]:
    """Valida y guarda la foto (solo PNG/JPG/WEBP, máx. 2 MB). Regresa la ruta pública o None."""
    if not data_url:
        return None
    cabecera, _, data_b64 = data_url.partition(",")
    if not (cabecera.startswith("data:") and cabecera.endswith(";base64")):
        raise ArchivoInvalidoException("La foto de perfil no es válida.")
    extension = FORMATOS_FOTO.get(cabecera[len("data:"):-len(";base64")])
    if extension is None:
        raise ArchivoInvalidoException("La foto debe ser PNG, JPG o WEBP.")
    if len(data_b64) > MAX_FOTO_BYTES * 4 // 3 + 4:
        raise ArchivoDemasiadoGrandeException("La foto supera los 2 MB.")
    try:
        datos = base64.b64decode(data_b64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ArchivoInvalidoException("La foto de perfil no es válida.") from exc

    # Revisa los "números mágicos": que el contenido sea realmente la imagen que dice ser
    es_valida = (
        (extension == "png" and datos.startswith(b"\x89PNG\r\n\x1a\n"))
        or (extension == "jpg" and datos.startswith(b"\xff\xd8\xff"))
        or (extension == "webp" and datos[:4] == b"RIFF" and datos[8:12] == b"WEBP")
    )
    if not es_valida:
        raise ArchivoInvalidoException("El contenido de la foto no corresponde a su formato.")

    nombre_archivo = f"{uuid.uuid4()}.{extension}"
    with open(f"static/avatars/{nombre_archivo}", "wb") as archivo:
        archivo.write(datos)
    return f"/static/avatars/{nombre_archivo}"


def crear_pintor(db: Session, payload: PintorCreate) -> PintorResponse:
    # Validar que el usuario no exista
    if pintores_repository.exists_by_email(db, payload.email):
        raise EmailYaRegistradoException(payload.email)

    if pintores_repository.exists_by_seudonimo(db, payload.seudonimo):
        raise SeudonimoYaRegistradoException(f"El seudonimo {payload.seudonimo} ya se encuentra registrado.")

    hashed_contrasena: str = get_password_hash(payload.contrasena)

    payload.contrasena = hashed_contrasena

    ruta_foto: Optional[str] = _guardar_foto_perfil(payload.foto_perfil_b64)

    # Guardar en base de datos
    new_pintor: Pintor = pintores_repository.save(
        db, payload, ruta_foto, payload.clave_publica_ecdsa
    )

    return PintorResponse(
        id=new_pintor.id,
        email=new_pintor.email,
        clave_publica_ecdsa=new_pintor.clave_publica_ecdsa,
    )





def login_jurado(db: Session, email: str, contrasena_plana: str) -> dict[str, Any]:
    jurado: Jurado = jurado_repository.find_by_email(db, email)
    
    if not jurado or not verify_password(contrasena_plana, jurado.password):
        raise CredencialesInvalidasException("No se ha podido autenticar con las credenciales proporcionadas")
        
    # Extraemos el valor del Enum (ej. "JUEZ" o "PRESIDENTE")
    rol_str: str = jurado.rol.value 
    
    token = create_access_token(
        subject_id=jurado.id,
        email=jurado.email,
        tipo_actor="JURADO",
        rol_especifico=rol_str
    )
    
    return {"access_token": token, "token_type": "bearer"}


def login_pintor(db: Session, email: str, contrasena_plana: str) -> dict[str, Any]:
    pintor = pintores_repository.find_by_email(db, email)
    
    if not pintor or not verify_password(contrasena_plana, pintor.contrasena):
        raise CredencialesInvalidasException("No se ha podido autenticar con las credenciales proporcionadas")
        
    token = create_access_token(
        subject_id=pintor.id,
        email=pintor.email,
        tipo_actor="PINTOR",
        rol_especifico="PINTOR",
        jti=uuid.uuid4().hex
    )
    
    return {"access_token": token, "token_type": "bearer"}
