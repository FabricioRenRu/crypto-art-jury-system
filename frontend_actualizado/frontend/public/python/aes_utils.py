"""Cifrado AES-256-GCM de pinturas en el worker del navegador."""
import base64
import hashlib
import json

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

TAM_LLAVE = 32
TAM_NONCE = 12
TAM_TAG = 16
PREFIJO_AAD = "concurso-pintura:obra:"
_LLAVES_AES_SESION = {}


def _a_bytes(valor):
    if isinstance(valor, (bytes, bytearray, memoryview)):
        return bytes(valor)
    if hasattr(valor, "to_bytes") and not isinstance(valor, int):
        return valor.to_bytes()
    if hasattr(valor, "to_py"):
        return bytes(valor.to_py())
    return bytes(valor)


def _a_python(valor):
    return valor.to_py() if hasattr(valor, "to_py") else valor


def _b64(valor):
    return base64.b64encode(valor).decode("ascii")


def _aad(id_pintura):
    return (PREFIJO_AAD + str(id_pintura)).encode("utf-8")


def generar_aes(payload=None):
    return {"llave": _b64(get_random_bytes(TAM_LLAVE))}


def cifrar_pintura(payload_js):
    payload = _a_python(payload_js)
    datos = _a_bytes(payload["datos"])
    if not datos:
        raise ValueError("La imagen está vacía.")

    llave = get_random_bytes(TAM_LLAVE)
    id_pintura = str(payload["id_pintura"])
    _LLAVES_AES_SESION[id_pintura] = _b64(llave)
    nonce = get_random_bytes(TAM_NONCE)
    cifrador = AES.new(llave, AES.MODE_GCM, nonce=nonce, mac_len=TAM_TAG)
    cifrador.update(_aad(id_pintura))
    ciphertext, tag = cifrador.encrypt_and_digest(datos)
    paquete = nonce + ciphertext + tag

    return {
        "cifrado": paquete,
        "hash_original": hashlib.sha256(datos).hexdigest(),
        "hash_cifrado": hashlib.sha256(paquete).hexdigest(),
    }


def descifrar_pintura(payload_js):
    payload = _a_python(payload_js)
    paquete = _a_bytes(payload["cifrado"])
    llave_b64 = _LLAVES_AES_SESION.get(str(payload["id_pintura"]))
    if llave_b64 is None:
        return {"disponible": False}
    llave = base64.b64decode(llave_b64, validate=True)
    if len(llave) != TAM_LLAVE or len(paquete) < TAM_NONCE + TAM_TAG:
        raise ValueError("Llave AES o paquete cifrado inválido.")

    nonce = paquete[:TAM_NONCE]
    ciphertext = paquete[TAM_NONCE:-TAM_TAG]
    tag = paquete[-TAM_TAG:]
    descifrador = AES.new(llave, AES.MODE_GCM, nonce=nonce, mac_len=TAM_TAG)
    descifrador.update(_aad(payload["id_pintura"]))
    return {"disponible": True, "datos": descifrador.decrypt_and_verify(ciphertext, tag)}


def verificar_llave_aes(payload_js):
    payload = _a_python(payload_js)
    return {"disponible": str(payload["id_pintura"]) in _LLAVES_AES_SESION}


def obtener_llave_sesion(id_pintura):
    """K_AES de una obra en bytes, o None si no esta en esta sesion (la usan los sobres)."""
    llave_b64 = _LLAVES_AES_SESION.get(str(id_pintura))
    if llave_b64 is None:
        return None
    return base64.b64decode(llave_b64, validate=True)


def guardar_llave_sesion(id_pintura, llave):
    """Guarda K_AES recuperada de un sobre para que descifrar_pintura la encuentre."""
    if len(llave) != TAM_LLAVE:
        raise ValueError("La llave AES debe medir 32 bytes.")
    _LLAVES_AES_SESION[str(id_pintura)] = _b64(llave)


def limpiar_llaves_sesion():
    _LLAVES_AES_SESION.clear()
