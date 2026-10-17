"""
/public/python/aes_utils.py
Funciones de prueba para verificar que el worker jale
"""
from Crypto.Random import get_random_bytes
import base64

def generar_aes(payload):
    llave_bytes = get_random_bytes(32)
    # La convertimos a Base64 para poder mandarla como texto a Javascript
    llave_b64 = base64.b64encode(llave_bytes).decode('utf-8')
    return { "llave": llave_b64 }