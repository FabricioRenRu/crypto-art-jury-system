from fastapi import APIRouter, Depends
from app.schemas.pintor_schemas import *
import app.services.auth_service as auth_service
from app.database.connection import get_db
from sqlalchemy.orm import Session
from app.schemas.auth_schemas import LoginRequest, TokenResponse
from app.dependencies.auth_deps import require_pintor

router: APIRouter = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/pintores/registro", response_model=PintorRegistroResponse)
def registrar_pintor(
    payload: PintorCreate,
    db: Session = Depends(get_db)
):
    """
    Explicación: Registra un nuevo pintor en el sistema y almacena su clave pública ECDSA para la validación de consentimientos.
    Espera recibir: Un JSON con nombre, seudónimo, email, contraseña y foto opcional. El servidor genera el par ECDSA.
    Espera devolver: id, email, clave pública y la clave privada (solo esta vez; no se guarda).
    """
    return auth_service.crear_pintor(db, payload)



@router.post("/pintores/login", response_model=TokenResponse)
def login_pintor(
    payload: LoginRequest, 
    db: Session = Depends(get_db)
):

    return auth_service.login_pintor(db, payload.email, payload.contrasena)

@router.post("/jurados/login", response_model=TokenResponse)
def login_jurado(
    payload: LoginRequest, 
    db: Session = Depends(get_db)
):
    return auth_service.login_jurado(db, payload.email, payload.contrasena)


@router.post("/pintores/llave", response_model=EstadoLlaveResponse)
def cargar_llave_pintor(
    body: CargarLlaveRequest,
    payload: dict = Depends(require_pintor),
    db: Session = Depends(get_db)
):
    """
    Explicación: Paso 2 del login. El pintor sube su .pem; se valida contra su pública y queda solo en RAM.
    Espera recibir: JWT de pintor y `pem` con la llave privada.
    Espera devolver: `lista: true`.
    """
    return auth_service.cargar_llave_privada_pintor(db, payload, body.pem)


@router.get("/pintores/llave/estado", response_model=EstadoLlaveResponse)
def estado_llave_pintor(payload: dict = Depends(require_pintor)):
    """Indica si la sesión actual aún tiene la llave en RAM (si no, hay que volver a subir el .pem)."""
    return auth_service.estado_llave_pintor(payload)
