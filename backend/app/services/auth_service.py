import app.repositories.pintores_repository as pintores_repository
import app.repositories.jurado_repository as jurado_repository
from sqlalchemy.orm import Session
from app.schemas.pintor_schemas import *
from app.exceptions.custom_exceptions import EmailYaRegistradoException, CredencialesInvalidasException
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.models.pintor import Pintor
from app.models.jurado import Jurado
from typing import Any



def crear_pintor(db: Session, payload: PintorCreate) -> PintorResponse:
    # Validar que el usuario no exista
    if pintores_repository.exists_by_email(db, payload.email):
        raise EmailYaRegistradoException(payload.email)
    
    print(f"==== LONGITUD DEL TEXTO A HASHEAR: {len(payload.contrasena)} ====")
    print(f"==== CONTENIDO: {payload.contrasena} ====")
    # hashear contrasena
    hashed_contrasena: str = get_password_hash(payload.contrasena)

    payload.contrasena = hashed_contrasena

    # Guardar en base de datos
    new_pintor: Pintor = pintores_repository.save(db, payload)


    # Devolver respuesta
    return PintorResponse(
        id=new_pintor.id,
        email=new_pintor.email,
        clave_publica_firma=new_pintor.clave_publica_firma
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
        rol_especifico="PINTOR"
    )
    
    return {"access_token": token, "token_type": "bearer"}
    