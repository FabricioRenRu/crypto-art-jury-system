from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
import uuid

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


@router.get("/obras/{id_pintura}/imagen-cifrada", response_model=None)
def imagen_cifrada_publica(id_pintura: uuid.UUID, db: Session = Depends(get_db)):
    """Paquete cifrado de una obra revelada; el navegador lo descifra con la llave del tablero."""
    return Response(
        content=resultados_service.obtener_imagen_cifrada_publica(db, id_pintura),
        media_type="application/octet-stream",
    )