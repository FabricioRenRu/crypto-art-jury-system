"""Primitivas del backend para crear llaves ECDSA, verificar firmas y calcular hashes."""
import hashlib
from typing import Final

from Crypto.Hash import SHA256
from Crypto.PublicKey import ECC
from Crypto.Signature import DSS

LONGITUD_NONCE: Final[int] = 12
LONGITUD_TAG: Final[int] = 16


def generar_par_ecdsa() -> tuple[str, str]:
    """Devuelve (privada_pem, publica_pem) en curva P-256."""
    llave: ECC.EccKey = ECC.generate(curve="P-256")
    return (
        llave.export_key(format="PEM"),
        llave.public_key().export_key(format="PEM"),
    )


def verificar_ecdsa(publica_pem: str, mensaje: bytes, firma_hex: str) -> bool:
    try:
        llave: ECC.EccKey = ECC.import_key(publica_pem)
        DSS.new(llave, "fips-186-3").verify(SHA256.new(mensaje), bytes.fromhex(firma_hex))
        return True
    except (ValueError, TypeError):
        return False


def sha256_hex(datos: bytes) -> str:
    return hashlib.sha256(datos).hexdigest()
