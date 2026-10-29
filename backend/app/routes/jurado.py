from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import app.services.jurado_service as jurado_service
from app.database.connection import get_db
from app.dependencies.auth_deps import require_juez
from app.schemas.jurado_schemas import LlavesPublicasJuradoResponse, MisPinturasJuezResponse

router = APIRouter(prefix="/api/jurado", tags=["Jurado"])

@router.get("/llaves-publicas", response_model=LlavesPublicasJuradoResponse)
def obtener_llaves_jurado(db: Session = Depends(get_db)):
    """
    Explicación: Devuelve las claves públicas RSA de los jueces para que el navegador del pintor envuelva la llave AES (Sobres de llave).
    Espera recibir: Una petición GET simple (son datos públicos, no requiere token).
    Espera devolver: `jueces`: lista con id, nombre, `clave_publica_rsa` (PEM) y bits de cada juez.
    """
    return jurado_service.obtener_llaves_publicas(db)

@router.get("/mis-pinturas", response_model=MisPinturasJuezResponse)
def listar_pinturas_asignadas(
    payload: dict = Depends(require_juez),
    db: Session = Depends(get_db)
):
    """
    Explicación: Consulta la lista de pinturas que el juez actual tiene que evaluar (las que tienen un sobre para él).
    Espera recibir: Una petición GET con el JWT del juez.
    Espera devolver: `pinturas`: id, código anónimo, título, descripción, tipo MIME y si ya la evaluó.
    """
    return jurado_service.listar_pinturas_asignadas(db, payload)
