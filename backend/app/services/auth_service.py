import app.repositories.pintores_repository as pintores_repository
import app.repositories.jurado_repository as jurado_repository
from sqlalchemy.orm import Session
from app.schemas.pintor_schemas import *
from app.exceptions.custom_exceptions import EmailYaRegistradoException, CredencialesInvalidasException, LlaveInvalidaException, LlaveNoCorrespondeException
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.models.pintor import Pintor
from app.models.jurado import Jurado
from typing import Any
import os
import base64
import uuid
import logging
from app.utils import crypto
from app.services.key_vault import boveda_pintores
from app.exceptions.custom_exceptions import SeudonimoYaRegistradoException

logger = logging.getLogger(__name__)

# Carpeta para guardar las fotos de Perfil
os.makedirs("static/avatars", exist_ok=True)




def crear_pintor(db: Session, payload: PintorCreate) -> PintorRegistroResponse:
    # Validar que el usuario no exista
    if pintores_repository.exists_by_email(db, payload.email):
        raise EmailYaRegistradoException(payload.email)

    if pintores_repository.exists_by_seudonimo(db, payload.seudonimo):
        raise SeudonimoYaRegistradoException(f"El seudonimo {payload.seudonimo} ya se encuentra registrado.")

    # Generar el par ECDSA en el servidor. Solo se guarda la PUBLICA; la privada se le
    # devuelve al usuario una vez (para que la descargue) y no se persiste en ningun lado.
    privada_pem, publica_pem = crypto.generar_par_ecdsa()

    hashed_contrasena: str = get_password_hash(payload.contrasena)

    payload.contrasena = hashed_contrasena

    ruta_foto: str = None
    if payload.foto_perfil_b64 and payload.foto_perfil_b64.startswith("data:image"):
        # El frontend manda algo como "data:image/png;base64,iVBORw0KGgo..."
        # Separamos el encabezado de los datos reales
        cabecera, data_b64 = payload.foto_perfil_b64.split(";base64,")
        
        # Extraemos la extensión (png, jpeg, webp)
        extension: str = cabecera.split("/")[-1] 
        
        # Generamos un nombre único y seguro
        nombre_archivo: str = f"{uuid.uuid4()}.{extension}"
        ruta_fisica: str = f"static/avatars/{nombre_archivo}"
        
        # Decodificamos y guardamos el archivo en el disco duro
        with open(ruta_fisica, "wb") as archivo_imagen:
            archivo_imagen.write(base64.b64decode(data_b64))
            
        # Guardamos la ruta que irá a la base de datos
        ruta_foto: str = f"/static/avatars/{nombre_archivo}"

    # Guardar en base de datos
    new_pintor: Pintor = pintores_repository.save(
        db, payload, ruta_foto, publica_pem
    )


    # Devolver respuesta
    return PintorRegistroResponse(
        id=new_pintor.id,
        email=new_pintor.email,
        clave_publica_ecdsa=new_pintor.clave_publica_ecdsa,
        clave_privada_pem=privada_pem,
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


def cargar_llave_privada_pintor(db: Session, payload_token: dict, pem: str) -> EstadoLlaveResponse:
    """
    Valida que el .pem subido sea la privada que corresponde a la publica registrada del
    pintor y la deja en la boveda RAM ligada a esta sesion. No se escribe en la BD.
    """
    try:
        publica_subida = crypto.publica_de_privada(pem)
    except ValueError as exc:
        raise LlaveInvalidaException(str(exc))

    pintor = pintores_repository.find_by_id(db, uuid.UUID(payload_token["sub"]))
    if pintor is None or not crypto.mismas_publicas(publica_subida, pintor.clave_publica_ecdsa):
        raise LlaveNoCorrespondeException("Esa llave privada no corresponde a tu cuenta.")

    boveda_pintores.guardar(payload_token["jti"], pem, float(payload_token["exp"]))
    return EstadoLlaveResponse(lista=True)


def estado_llave_pintor(payload_token: dict) -> EstadoLlaveResponse:
    jti = payload_token.get("jti")
    return EstadoLlaveResponse(lista=bool(jti and boveda_pintores.obtener(jti)))
