"""
/public/python/ecdsa_utils.py
Firma digital del pintor: ECDSA sobre la curva P-256 con SHA-256.

- Las llaves se intercambian en formato PEM (privada: PKCS#8, publica: SubjectPublicKeyInfo).
- La firma es la concatenacion r||s (64 bytes) codificada en Base64. Es el mismo formato
  que usa WebCrypto (IEEE P1363), asi que se puede verificar tambien desde el navegador
  o desde el backend sin convertir nada.
- Se firma en modo deterministico (RFC 6979): no depende de la calidad del RNG del
  navegador para elegir el nonce k, y la misma entrada produce la misma firma.
- La "huella" de una llave publica es el SHA-256 de su DER (SubjectPublicKeyInfo) en hex.
  Sirve para comparar rapidamente dos llaves publicas sin leer todo el PEM.
"""

import base64
import hashlib

from Crypto.Hash import SHA256
from Crypto.PublicKey import ECC
from Crypto.Signature import DSS

CURVA = "P-256"


def _huella(llave_publica) -> str:
    der = llave_publica.export_key(format="DER")
    return hashlib.sha256(der).hexdigest()


def _cargar_privada(pem: str):
    llave = ECC.import_key(pem.strip())
    if not llave.has_private():
        raise ValueError("El PEM recibido no contiene una llave privada.")
    if CURVA not in llave.curve:
        raise ValueError(
            f"La llave debe estar en la curva {CURVA}, no en {llave.curve}."
        )
    return llave


def _cargar_publica(pem: str):
    llave = ECC.import_key(pem.strip())
    if CURVA not in llave.curve:
        raise ValueError(
            f"La llave debe estar en la curva {CURVA}, no en {llave.curve}."
        )
    return llave.public_key() if llave.has_private() else llave


def generar_ecdsa(payload):
    llave = ECC.generate(curve=CURVA)
    publica = llave.public_key()
    return {
        "privada": llave.export_key(format="PEM"),
        "publica": publica.export_key(format="PEM"),
        "huella": _huella(publica),
    }


def importar_ecdsa(payload):
    """Carga una llave privada PEM existente y devuelve su llave publica y huella."""
    llave = _cargar_privada(payload["privada"])
    publica = llave.public_key()
    return {
        "privada": llave.export_key(format="PEM"),
        "publica": publica.export_key(format="PEM"),
        "huella": _huella(publica),
    }


def firmar_consentimiento(payload):
    """
    Firma el texto del consentimiento (UTF-8 exacto) con la llave privada del pintor.
    payload: { documento: str, privada: str (PEM) }
    """
    llave = _cargar_privada(payload["privada"])
    datos = payload["documento"].encode("utf-8")
    h = SHA256.new(datos)
    firma = DSS.new(llave, "deterministic-rfc6979").sign(h)
    return {
        "firma": base64.b64encode(firma).decode("ascii"),
        "hash_documento": h.hexdigest(),
        "algoritmo": "ECDSA-P256-SHA256",
        "huella": _huella(llave.public_key()),
    }


def verificar_firma(payload):
    """
    Verifica una firma ECDSA.
    payload: { documento: str, firma: str (Base64 r||s), publica: str (PEM) }
    """
    publica = _cargar_publica(payload["publica"])
    h = SHA256.new(payload["documento"].encode("utf-8"))
    try:
        firma = base64.b64decode(payload["firma"], validate=True)
        DSS.new(publica, "fips-186-3").verify(h, firma)
        return {"valida": True}
    except (ValueError, TypeError):
        # ValueError: firma invalida o con longitud incorrecta / Base64 mal formado
        return {"valida": False}
