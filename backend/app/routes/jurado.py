from fastapi import APIRouter

router = APIRouter(prefix="/api/jurado", tags=["Jurado"])

@router.get("/mis-pinturas", response_model=None)
def listar_pinturas_asignadas():
    """
    Explicación: Consulta la lista de pinturas que el juez actual tiene pendientes de evaluar.
    Espera recibir: Una petición GET. (Depende del token o ID del juez en sesión).
    Espera devolver: Una lista de objetos con la información básica de las pinturas asignadas.
    """
    pass