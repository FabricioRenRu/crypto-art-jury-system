from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import app.services.resultados_service as resultados_service
from app.database.connection import get_db
from app.schemas.resultados_schemas import TableroPublicoResponse

router = APIRouter(prefix="/api/resultados", tags=["Resultados"])


@router.get("/tablero-publico", response_model=TableroPublicoResponse)
def obtener_tablero_publico(db: Session = Depends(get_db)):
    """
    Zona de Verificación Pública (sin autenticación): evaluaciones publicadas con sus
    firmas, llaves públicas y el ranking por suma de estrellas.
    """
    return resultados_service.obtener_tablero_publico(db)