from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import app.services.pinturas_service as pinturas_service
from app.database.connection import get_db
from app.dependencies.auth_deps import require_pintor
from app.schemas.pintor_schemas import PerfilPintorResponse

router = APIRouter(prefix="/api/pintores", tags=["Pintores"])


@router.get("/me", response_model=PerfilPintorResponse)
def mi_perfil(
    payload: dict = Depends(require_pintor),
    db: Session = Depends(get_db)
):
    """
    Explicación: Datos del encabezado del Panel del Pintor (nombre, torneo y foto).
    Espera recibir: JWT de pintor en el header Authorization.
    Espera devolver: nombre, seudonimo, torneo y ruta de la foto de perfil.
    """
    return pinturas_service.obtener_perfil(db, payload)
