from rsa_utils import generar_rsa
from aes_utils import (
    generar_aes,
    cifrar_pintura,
    descifrar_pintura,
    verificar_llave_aes,
    descifrar_obra_publica
)
from ecdsa_utils import firmar_consentimiento, generar_ecdsa_keys, firmar_mensaje
from session_utils import inyectar_llave_privada, verificar_boveda, inyectar_llave_presidente, cerrar_sesion
from sobre_llave_utils import generar_sobres, abrir_sobre
from blind_signature_utils import (
    preparar_evaluacion_cegada,
    blind_signature,
    preparar_publicacion,
    verificar_evaluacion_publica,
)
from sobre_pintor_utils import generar_sobre_pintor, abrir_sobre_pintor
from evidencia_utils import (
    describir_llave_ecdsa,
    describir_cifrado_aes,
    describir_sobres,
    describir_sobre_pintor,
    describir_firma_ecdsa,
    describir_llave_rsa,
    describir_sobre_juez,
    describir_cegado,
    describir_firma_ciega,
)


def probar_conexion(payload):
    return { "mensaje": "¡Conexión exitosa al main.py!" }