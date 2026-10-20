"""
public/python/ecdsa_utils.py
"""

from Crypto.PublicKey import ECC
from Crypto.Signature import DSS
from Crypto.Hash import SHA256
from session_utils import obtener_llave_actual
from typing import TypedDict

class PayloadFirma(TypedDict):
    mensaje: str


def generar_ecdsa_keys(payload=None) -> dict[str, str]:
    # 1. Generar par de llaves (Curva P-256)
    key: ECC.EccKey = ECC.generate(curve='P-256')
    
    # 2. Exportar en formato PEM
    private_pem: str = key.export_key(format='PEM')
    public_pem: str = key.public_key().export_key(format='PEM')
    
    return {
        "private_key": private_pem,
        "public_key": public_pem
    }



def firmar_mensaje(payload: PayloadFirma):
    """
    Firma un mensaje usando la llave que esta en memoria
    """
    mensaje = payload["mensaje"]

    private_pem: str = obtener_llave_actual()

    key: ECC.EccKey = ECC.import_key(private_pem)
    
    # Crear hash SHA-256 del mensaje
    h: SHA256.SHA256Hash = SHA256.new(mensaje.encode('utf-8'))
    
    # Firmar con algoritmo FIPS 186-3 / FIPS 186-4 (DSS)
    signer = DSS.new(key, 'fips-186-3')
    signature: bytes = signer.sign(h)
    
    # Retornar firma en hexadecimal para fácil transporte
    return {"firma_hex": signature.hex()}

