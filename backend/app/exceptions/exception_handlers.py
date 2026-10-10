import logging
from fastapi.responses import JSONResponse
from fastapi import Request, status

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




