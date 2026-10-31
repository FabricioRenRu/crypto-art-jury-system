"""
/app/services/presidente_service.py
"""
import app.repositories.jurado_repository as jurado_repository
from app.models.jurado import Jurado
from sqlalchemy.orm import Session
from app.exceptions.custom_exceptions import ConfiguracionJuradoIncompletaException
from app.schemas.jurado_schemas import LlavePublicaResponse
from app.utils.crypto import BITS_MINIMOS_LLAVE, bits_llave_publica
from typing import Final, List
import logging

NUM_PRESIDENTE: Final[int] = 1


logger: logging.Logger = logging.getLogger(__name__)

def obtener_llave_publica(db: Session) -> LlavePublicaResponse:


    # Obtenemos la lista de presidentes en la db (deberia haber solo 1)
    presidentes: List[Jurado] = jurado_repository.find_presidentes(db)

    if len(presidentes) != NUM_PRESIDENTE:
        logger.error("Se esperaba %d presidente y hay %d", NUM_PRESIDENTE, len(presidentes))
        raise ConfiguracionJuradoIncompletaException(
            "El jurado aun no esta configurado; intenta mas tarde."
        )

    
    presidente: Jurado = presidentes[0]

    if not presidente.clave_publica_rsa:
        logger.error("El presidente %s no tiene clave publica registrada", presidente.id)
        raise ConfiguracionJuradoIncompletaException(
            "Falta la llave publica del presidente; corre seed_jurados.py."
        )
    
    bits: int = bits_llave_publica(presidente.clave_publica_rsa)
  
    if bits < BITS_MINIMOS_LLAVE:
        logger.error("El presidente %s no tiene una llave publica RSA valida", presidente.id)
        raise ConfiguracionJuradoIncompletaException(
                "Falta la llave publica del presidente; corre seed_jurados.py."
            )

    return LlavePublicaResponse(
        id= presidente.id,
        nombre=presidente.nombre,
        clave_publica_rsa=presidente.clave_publica_rsa,
        bits=bits        
    )
        

    