"""
/app/routes/evaluaciones.py
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import app.services.evaluacion_service as evaluacion_service
from app.database.connection import get_db
from app.dependencies.auth_deps import require_juez
from app.schemas.evaluacion_schemas import (
    HashedEvaluationCreate,
    HashedEvaluationResponse,
    MisEvaluacionesResponse,
    PublicarEvaluacionRequest,
    PublicarEvaluacionResponse,
)

router = APIRouter(prefix="/api/evaluaciones", tags=["Evaluaciones"])


@router.post("/cegadas", response_model=HashedEvaluationResponse, status_code=201)
def subir_evaluacion_cegada(
    request_payload: HashedEvaluationCreate,
    user_payload: dict = Depends(require_juez),
    db: Session = Depends(get_db),
):
    """
    Guarda h' y la evaluación cifrada del juez (estado ESPERANDO_FIRMA).
    El servidor no puede leer estrellas ni comentarios.
    """
    return evaluacion_service.guardar_hash_evaluaciones(db, request_payload, uuid.UUID(user_payload["sub"]))


@router.get("/mis-evaluaciones", response_model=MisEvaluacionesResponse)
def mis_evaluaciones(
    user_payload: dict = Depends(require_juez),
    db: Session = Depends(get_db),
):
    """
    Evaluaciones del juez con su estado; las FIRMADO traen s' y la evaluación cifrada
    para que el navegador del juez la descegue y la publique.
    """
    return evaluacion_service.listar_mis_evaluaciones(db, uuid.UUID(user_payload["sub"]))


@router.post("/publicar", response_model=PublicarEvaluacionResponse)
def publicar_evaluacion(
    request_payload: PublicarEvaluacionRequest,
    user_payload: dict = Depends(require_juez),
    db: Session = Depends(get_db),
):
    """
    Recibe la evaluación en claro, s (firma descegada del presidente) y la firma RSA-PSS
    del juez. Verifica ambas firmas y cambia el estado a PUBLICADO.
    """
    return evaluacion_service.publicar_evaluacion(db, request_payload, uuid.UUID(user_payload["sub"]))