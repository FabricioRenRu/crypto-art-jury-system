from fastapi import APIRouter

router = APIRouter(prefix="/api/jurado", tags=["Jurado"])

@router.get("/llaves-publicas", response_model=None)
def obtener_llaves_jurado():
    """
    Explicación: Devuelve las claves públicas RSA de todos los jueces activos para que el frontend del pintor pueda encriptar la llave AES (Sobres de llave).
    Espera recibir: Una petición GET simple.
    Espera devolver: Una lista con los datos de los jueces y sus respectivas `clave_publica_rsa`.
    """
    pass

@router.get("/mis-pinturas", response_model=None)
def listar_pinturas_asignadas():
    """
    Explicación: Consulta la lista de pinturas que el juez actual tiene pendientes de evaluar.
    Espera recibir: Una petición GET. (Depende del token o ID del juez en sesión).
    Espera devolver: Una lista de objetos con la información básica de las pinturas asignadas.
    """
    pass