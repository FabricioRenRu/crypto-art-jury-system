from fastapi import APIRouter, Depends
from app.schemas.pintor_schemas import *
import app.services.auth_service as auth_service
from app.database.connection import get_db
from sqlalchemy.orm import Session
from app.schemas.auth_schemas import LoginRequest, TokenResponse

router: APIRouter = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/pintores/registro", response_model=PintorResponse)
def registrar_pintor(
    payload: PintorCreate,
    db: Session = Depends(get_db)
):
    """
    Explicación: Registra un nuevo pintor en el sistema y almacena su clave pública ECDSA para la validación de consentimientos.
    Espera recibir: Un JSON con el nombre del pintor y su `clave_publica_firma` en formato PEM o texto.
    Espera devolver: Un mensaje de éxito y el `id_pintor` generado.
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

