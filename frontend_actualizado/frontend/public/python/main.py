from rsa_utils import generar_rsa
from aes_utils import (
    generar_aes,
    cifrar_pintura,
    descifrar_pintura,
    verificar_llave_aes,
)
from ecdsa_utils import firmar_consentimiento, generar_ecdsa_keys, firmar_mensaje
from session_utils import inyectar_llave_privada, verificar_boveda
from sobre_llave_utils import generar_sobres, abrir_sobre

def probar_conexion(payload):
    return { "mensaje": "¡Conexión exitosa al main.py!" }