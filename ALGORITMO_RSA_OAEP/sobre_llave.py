import base64
import secrets

from oaep import cifrar_oaep, descifrar_oaep

LONGITUD_LLAVE_AES = 32  # AES-256
PREFIJO_ETIQUETA = "concurso-pintura:obra:"


def generar_llave_sesion():
    return secrets.token_bytes(LONGITUD_LLAVE_AES)


def construir_etiqueta(id_obra):
    # La etiqueta OAEP amarra el sobre a una obra: no se puede reutilizar con otra pintura
    return (PREFIJO_ETIQUETA + str(id_obra)).encode("utf-8")


def envolver_llave(llave_sesion, llave_publica_jurado, id_obra):
    # CK = RSA-OAEP(PK_jurado, K_AES)
    sobre = cifrar_oaep(llave_sesion, llave_publica_jurado, construir_etiqueta(id_obra))
    if sobre is None:
        return None
    return base64.b64encode(sobre).decode("ascii")


def desenvolver_llave(sobre_base64, llave_privada_jurado, id_obra):
    try:
        sobre = base64.b64decode(sobre_base64, validate=True)
    except ValueError:
        return None

    llave_sesion = descifrar_oaep(sobre, llave_privada_jurado, construir_etiqueta(id_obra))
    if llave_sesion is None or len(llave_sesion) != LONGITUD_LLAVE_AES:
        return None
    return llave_sesion


def generar_sobres_jurado(llave_sesion, llaves_publicas_jurado, id_obra):
    # Un sobre por juez, cada uno cifrado con la llave publica de ese juez
    sobres = {}
    for id_juez, llave_publica in llaves_publicas_jurado.items():
        sobres[id_juez] = envolver_llave(llave_sesion, llave_publica, id_obra)
    return sobres
