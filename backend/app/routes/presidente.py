from fastapi import APIRouter

router = APIRouter(prefix="/api/presidente", tags=["Presidente"])

@router.get("/votos-pendientes", response_model=None)
def listar_votos_pendientes():
    """
    Explicación: Obtiene la lista de evaluaciones que han sido cegadas por los jueces y están a la espera de autorización.
    Espera recibir: Una petición GET simple.
    Espera devolver: Un arreglo de evaluaciones que contengan el `id_evaluacion` y el `hash_cegado` (h').
    """
    pass

@router.post("/firmar-votos", response_model=None)
def firmar_votos_masivo():
    """
    Explicación: Recibe las firmas ciegas generadas localmente por el presidente y actualiza el estado de las evaluaciones a FIRMADO.
    Espera recibir: Un JSON con un arreglo de objetos que emparejan el `id_evaluacion` con su respectiva `firma_ciega` (s').
    Espera devolver: Un mensaje de éxito indicando cuántos votos fueron autorizados.
    """
    pass