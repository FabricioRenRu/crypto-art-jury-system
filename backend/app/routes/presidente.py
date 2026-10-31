from fastapi import APIRouter, Depends
import app.services.presidente_service as presidente_service
from app.database.connection import get_db
from app.schemas.jurado_schemas import LlavePublicaResponse
from app.dependencies.auth_deps import require_presidente
from sqlalchemy.orm import Session
import app.services.evaluacion_service as evaluacion_service
from app.schemas.evaluacion_schemas import *
from typing import List
router = APIRouter(prefix="/api/presidente", tags=["Presidente"])

@router.get("/evaluaciones-pendientes", response_model=List[HashPendiente])
def listar_votos_pendientes(
    user_payload: dict = Depends(require_presidente),
    db: Session = Depends(get_db)
):
    """
    Explicación: Obtiene la lista de evaluaciones que han sido cegadas por los jueces y están a la espera de autorización.
    Espera recibir: Una petición GET simple.
    Espera devolver: Un arreglo de evaluaciones que contengan el `id_evaluacion` y el `hash_cegado` (h').
    """
    return evaluacion_service.obtener_hashes_pendientes(db)

@router.post("/firmar-evaluaciones", response_model=None)
def firmar_votos_masivo(
    payload: FirmasMasivasRequest,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(require_presidente),
    
):
    """
    Explicación: Recibe las firmas ciegas generadas localmente por el presidente y actualiza el estado de las evaluaciones a FIRMADO.
    Espera recibir: Un JSON con un arreglo de objetos que emparejan el `id_evaluacion` con su respectiva `firma_ciega` (s').
    Espera devolver: Un mensaje de éxito indicando cuántos votos fueron autorizados.
    """
    pass
    procesadas = evaluacion_service.procesar_firmas_masivas(db, payload.firmas)
    
    return {
        "status": "success",
        "message": f"Se aplicaron {procesadas} firmas ciegas exitosamente."
    }


@router.get("/llave-publica", response_model=LlavePublicaResponse)
def obtener_llave_publica(
    db = Depends(get_db)
):
    """
    Obtiene la llave publica del presidente. Este se usa para realizar la firma ciega
    """
    return presidente_service.obtener_llave_publica(db)
    