"""
app/services/jurado_service.py
Llaves publicas RSA del jurado. El navegador del pintor las baja con
GET /api/jurado/llaves-publicas para envolver K_AES con RSA-OAEP (un sobre por juez).
"""
import logging
from typing import Final

from Crypto.PublicKey import RSA
from sqlalchemy.orm import Session

import app.repositories.jurado_repository as jurado_repository
from app.exceptions.custom_exceptions import ConfiguracionJuradoIncompletaException
from app.schemas.jurado_schemas import LlavePublicaJuezResponse, LlavesPublicasJuradoResponse

logger = logging.getLogger(__name__)

NUM_JUECES: Final[int] = 3
BITS_MINIMOS_LLAVE: Final[int] = 2048


def bits_llave_publica(llave_publica_pem: str) -> int:
    """Tamano del modulo n en bits, o 0 si el PEM no es una llave publica RSA valida."""
    try:
        llave = RSA.import_key(llave_publica_pem)
    except (ValueError, IndexError, TypeError):
        return 0
    if llave.has_private():
        # Nunca se publica una llave privada por error
        return 0
    return llave.size_in_bits()


def obtener_llaves_publicas(db: Session) -> LlavesPublicasJuradoResponse:
    jueces = jurado_repository.find_jueces(db)
    if len(jueces) != NUM_JUECES:
        logger.error("Se esperaban %d jueces y hay %d", NUM_JUECES, len(jueces))
        raise ConfiguracionJuradoIncompletaException(
            "El jurado aun no esta configurado; intenta mas tarde."
        )

    llaves = []
    for juez in jueces:
        bits = 0
        if juez.clave_publica_rsa:
            bits = bits_llave_publica(juez.clave_publica_rsa)
        if bits < BITS_MINIMOS_LLAVE:
            # Sin una llave valida ese juez no podria abrir su sobre
            logger.error("El juez %s no tiene una llave publica RSA valida", juez.id)
            raise ConfiguracionJuradoIncompletaException(
                "Falta la llave publica de un juez; corre seed_jurados.py."
            )

        llaves.append(
            LlavePublicaJuezResponse(
                id=juez.id,
                nombre=juez.nombre,
                clave_publica_rsa=juez.clave_publica_rsa,
                bits=bits,
            )
        )
    return LlavesPublicasJuradoResponse(jueces=llaves)
