from fastapi import APIRouter

router: APIRouter = APIRouter(prefix="/api/pintores", tags=["Pintores"])

@router.post("/registro", response_model=None)
def registrar_pintor():
    """
    Explicación: Registra un nuevo pintor en el sistema y almacena su clave pública ECDSA para la validación de consentimientos.
    Espera recibir: Un JSON con el nombre del pintor y su `clave_publica_firma` en formato PEM o texto.
    Espera devolver: Un mensaje de éxito y el `id_pintor` generado.
    """
    pass