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
    Explicación: Registra un pintor y conserva únicamente su llave pública ECDSA.
    Espera recibir: Datos del pintor, llave pública ECDSA P-256 y foto opcional.
    Espera devolver: id, email y llave pública; nunca recibe ni devuelve la privada.
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
