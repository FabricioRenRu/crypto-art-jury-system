"""
/public/python/aes_utils.py
Cifrado simetrico de la obra con AES-256-GCM.

Formato del archivo cifrado (el "blob" que se sube al servidor):

    nonce (12 bytes) || texto_cifrado (N bytes) || tag (16 bytes)

- Llave: 32 bytes aleatorios (256 bits). Nunca viaja en claro: en el protocolo final se
  cifra con la llave publica RSA de cada juez (los "sobres").
- Nonce: 12 bytes aleatorios (96 bits), nuevo en cada cifrado. Con una llave nueva por obra
  no hay riesgo de reutilizar el par (llave, nonce).
- Tag: 16 bytes de autenticacion GCM. Si alguien altera un solo bit del blob, del nonce
  o del AAD, el descifrado falla en lugar de devolver basura.
- AAD (datos autenticados adicionales): texto que NO se cifra pero SI se autentica.
  Debe ser identico al descifrar.
"""
import base64
import hashlib

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

TAM_LLAVE = 32
TAM_NONCE = 12
TAM_TAG = 16


def _a_bytes(valor) -> bytes:
    """Acepta lo que pueda llegar desde JavaScript (memoryview, JsBuffer, bytes...)."""
    if isinstance(valor, (bytes, bytearray, memoryview)):
        return bytes(valor)
    if hasattr(valor, "to_bytes") and not isinstance(valor, int):  # JsBuffer de Pyodide
        return valor.to_bytes()
    if hasattr(valor, "to_py"):
        return bytes(valor.to_py())
    return bytes(valor)


def _b64(b: bytes) -> str:
    return base64.b64encode(b).decode("ascii")


def generar_aes(payload):
    """Solo genera una llave AES-256 (se mantiene por compatibilidad con la pagina de pruebas)."""
    return {"llave": _b64(get_random_bytes(TAM_LLAVE))}


def cifrar_aes_gcm(payload):
    """
    payload: { datos: bytes, aad?: str, llave?: str (Base64, 32 bytes; si falta se genera) }
    """
    datos = _a_bytes(payload["datos"])
    aad = (payload.get("aad") or "").encode("utf-8")

    llave_b64 = payload.get("llave")
    llave = base64.b64decode(llave_b64) if llave_b64 else get_random_bytes(TAM_LLAVE)
    if len(llave) != TAM_LLAVE:
        raise ValueError("La llave AES debe medir exactamente 32 bytes (AES-256).")

    nonce = get_random_bytes(TAM_NONCE)
    cipher = AES.new(llave, AES.MODE_GCM, nonce=nonce, mac_len=TAM_TAG)
    cipher.update(aad)
    texto_cifrado, tag = cipher.encrypt_and_digest(datos)

    blob = nonce + texto_cifrado + tag
    return {
        "llave": _b64(llave),
        "nonce": _b64(nonce),
        "tag": _b64(tag),
        "cifrado": blob,
        "hash_original": hashlib.sha256(datos).hexdigest(),
        "hash_cifrado": hashlib.sha256(blob).hexdigest(),
    }


def descifrar_aes_gcm(payload):
    """
    payload: { cifrado: bytes (blob), llave: str (Base64), aad?: str, solo_hash?: bool }
    Lanza ValueError si el tag no coincide (archivo, llave o AAD alterados).
    """
    blob = _a_bytes(payload["cifrado"])
    llave = base64.b64decode(payload["llave"])
    aad = (payload.get("aad") or "").encode("utf-8")

    if len(blob) < TAM_NONCE + TAM_TAG:
        raise ValueError("El archivo cifrado es demasiado corto.")

    nonce = blob[:TAM_NONCE]
    tag = blob[-TAM_TAG:]
    texto_cifrado = blob[TAM_NONCE:-TAM_TAG]

    cipher = AES.new(llave, AES.MODE_GCM, nonce=nonce, mac_len=TAM_TAG)
    cipher.update(aad)
    try:
        datos = cipher.decrypt_and_verify(texto_cifrado, tag)
    except ValueError:
        raise ValueError("Autenticacion GCM fallida: el archivo, la llave o el AAD fueron alterados.")

    resultado = {"hash": hashlib.sha256(datos).hexdigest()}
    if not payload.get("solo_hash"):
        resultado["datos"] = datos
    return resultado
