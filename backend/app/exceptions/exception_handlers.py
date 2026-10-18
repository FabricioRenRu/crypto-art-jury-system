import logging
from fastapi.responses import JSONResponse
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from app.exceptions.custom_exceptions import *

logger: logging.Logger = logging.getLogger(__name__)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global Exception Handler para manejar excepciones inesperadas.
    """
    logger.error(f"Error no controlado en {request.url.path}: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "code": "INTERNAL_SERVER_ERROR",
            "message": "Ocurrio un error inesperado en el servidor.",
            "detail": str(exc)
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # exc.errors() devuelve una lista con todos los campos que fallaron.
    # Vamos a extraerlos para armar un mensaje limpio.
    errores_formateados = []
    for error in exc.errors():
        campo: str = error["loc"][-1] 
        mensaje: str = error["msg"]   
        
        # Pydantic a veces pone "Value error, " antes del mensaje
        mensaje_limpio = mensaje.replace("Value error, ", "")
        errores_formateados.append(f"{campo}: {mensaje_limpio}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "code": "VALIDATION_ERROR",
            "message": "Los datos enviados no son validos.",
            "details": errores_formateados 
        }
    )


async def email_registrado_exception_handler(request: Request, exc: EmailYaRegistradoException) -> JSONResponse:
    logger.warning(f"Intento de registro con email duplicado: {exc.email}")
    
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "status": "error",
            "code": "EMAIL_DUPLICADO",
            "message": str(exc)
        }
    )

async def credenciales_invalidas_exception_handler(request: Request, exc: CredencialesInvalidasException) -> JSONResponse:
    logger.warning(f"Intento de autenticacion con credenciales incorrectas")
        
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "status": "error",
            "code": "CREDENCIALES INCORRECTAS",
            "message": str(exc)
        }
    )



