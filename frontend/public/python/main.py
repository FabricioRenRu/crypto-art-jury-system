from rsa_utils import generar_rsa
from aes_utils import generar_aes, cifrar_aes_gcm, descifrar_aes_gcm
from ecdsa_utils import generar_ecdsa, importar_ecdsa, firmar_consentimiento, verificar_firma

def probar_conexion(payload):
    return { "mensaje": "¡Conexión exitosa al main.py!" }
