"""
app/services/auth_service.py
Registro e inicio de sesión de pintores y jurados.
"""
import logging
import uuid
from typing import Any, Optional

from sqlalchemy.orm import Session

import app.repositories.jurado_repository as jurado_repository
import app.repositories.pintores_repository as pintores_repository
import app.services.avatares_service as avatares_service
from app.exceptions.custom_exceptions import (
    CredencialesInvalidasException,
    EmailYaRegistradoException,
    SeudonimoYaRegistradoException,
)
from app.models.jurado import Jurado
from app.models.pintor import Pintor
from app.schemas.pintor_schemas import PintorCreate, PintorResponse
from app.utils.security import create_access_token, get_password_hash, verify_password

logger = logging.getLogger(__name__)


def crear_pintor(db: Session, payload: PintorCreate) -> PintorResponse:
    # Validar que el usuario no exista
    if pintores_repository.exists_by_email(db, payload.email):
        raise EmailYaRegistradoException(payload.email)

    if pintores_repository.exists_by_seudonimo(db, payload.seudonimo):
        raise SeudonimoYaRegistradoException(f"El seudonimo {payload.seudonimo} ya se encuentra registrado.")

    payload.contrasena = get_password_hash(payload.contrasena)

    # La foto se guarda en el almacenamiento (disco o bucket) y en la BD solo queda su ruta pública
    ruta_foto: Optional[str] = avatares_service.guardar_foto_perfil(payload.foto_perfil_b64)

    try:
        new_pintor: Pintor = pintores_repository.save(db, payload, ruta_foto, payload.clave_publica_ecdsa)
    except Exception:
        # Si la BD falla, no dejamos fotos huérfanas
        db.rollback()
        avatares_service.borrar_foto_perfil(ruta_foto)
        raise

    return PintorResponse(
        id=new_pintor.id,
        email=new_pintor.email,
        clave_publica_ecdsa=new_pintor.clave_publica_ecdsa,
    )


def login_jurado(db: Session, email: str, contrasena_plana: str) -> dict[str, Any]:
    jurado: Optional[Jurado] = jurado_repository.find_by_email(db, email)

    if not jurado or not verify_password(contrasena_plana, jurado.password):
        raise CredencialesInvalidasException("No se ha podido autenticar con las credenciales proporcionadas")

    token = create_access_token(
        subject_id=jurado.id,
        email=jurado.email,
        tipo_actor="JURADO",
        rol_especifico=jurado.rol.value,  # "JUEZ" o "PRESIDENTE"
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
        jti=uuid.uuid4().hex,
    )
    return {"access_token": token, "token_type": "bearer"}