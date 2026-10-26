"""
public/python/ecdsa_utils.py
"""

import json
from datetime import datetime, timezone

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


def firmar_consentimiento(payload_js):
    """Construye y firma el documento de consentimiento con la llave privada local."""
    payload = payload_js.to_py() if hasattr(payload_js, "to_py") else payload_js
    documento = json.dumps(
        {
            "tipo": "consentimiento_participacion",
            "version": 1,
            "id_pintura": str(payload["id_pintura"]),
            "id_pintor": str(payload["id_pintor"]),
            "algoritmo_cifrado": "AES-256-GCM",
            "hash_sha256_pintura_cifrada": payload["hash_cifrado"],
            "fecha_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "declaracion": "Certifico la autoria humana de la obra y autorizo su exhibicion.",
        },
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    llave = ECC.import_key(obtener_llave_actual())
    firma = DSS.new(llave, "fips-186-3").sign(SHA256.new(documento.encode("utf-8")))
    return {"documento": documento, "firma_hex": firma.hex()}
