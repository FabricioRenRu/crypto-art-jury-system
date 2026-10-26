"""
/public/python/sobre_llave_utils.py
Sobres de llave: CK = RSA-OAEP(PK_juez, K_AES), uno por juez.
K_AES nunca sale del worker: el pintor la envuelve aqui y el juez la desenvuelve aqui.
"""
import base64

from aes_utils import guardar_llave_sesion, obtener_llave_sesion
from rsa_utils import cifrar_oaep, descifrar_oaep
from session_utils import obtener_llave_actual, obtener_rol_actual

LONGITUD_LLAVE_AES = 32  # AES-256
PREFIJO_ETIQUETA = "concurso-pintura:obra:"


def _a_python(valor):
    return valor.to_py() if hasattr(valor, "to_py") else valor


def construir_etiqueta(id_obra):
    # La etiqueta OAEP amarra el sobre a una obra: no se puede reutilizar con otra pintura.
    # Es la misma cadena que aes_utils usa como datos asociados de AES-GCM
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
    # Un sobre por juez, cada uno cifrado con la llave publica de ese juez.
    # Si un solo sobre falla no se regresa ninguno: la obra no puede quedar sin un juez
    sobres = {}
    for id_juez, llave_publica in llaves_publicas_jurado.items():
        sobre = envolver_llave(llave_sesion, llave_publica, id_obra)
        if sobre is None:
            return None
        sobres[id_juez] = sobre
    return sobres


def generar_sobres(payload_js):
    """
    Pintor. Recibe {id_pintura, jueces: [{id, clave_publica_rsa}]} (lo que regresa
    GET /api/jurado/llaves-publicas) y envuelve la K_AES con la que se cifro esa obra.
    """
    payload = _a_python(payload_js)
    id_pintura = str(payload["id_pintura"])

    llave_sesion = obtener_llave_sesion(id_pintura)
    if llave_sesion is None:
        raise ValueError("Primero cifra la obra: no hay llave AES para esta pintura.")

    llaves_publicas = {}
    for juez in payload["jueces"]:
        llaves_publicas[str(juez["id"])] = juez["clave_publica_rsa"]
    if len(llaves_publicas) == 0:
        raise ValueError("El servidor no regreso llaves publicas del jurado.")

    sobres = generar_sobres_jurado(llave_sesion, llaves_publicas, id_pintura)
    if sobres is None:
        raise ValueError("Una llave publica del jurado no es valida.")
    return {"sobres": sobres}


def abrir_sobre(payload_js):
    """
    Juez. Recibe {id_pintura, sobre} (de GET /api/pinturas/{id}/descargar), recupera K_AES con
    la llave privada RSA inyectada en la sesion y la deja lista para descifrar_pintura.
    """
    payload = _a_python(payload_js)
    if obtener_rol_actual() != "jurado":
        raise ValueError("Solo un juez puede abrir un sobre de llave.")

    id_pintura = str(payload["id_pintura"])
    llave_sesion = desenvolver_llave(payload["sobre"], obtener_llave_actual(), id_pintura)
    if llave_sesion is None:
        raise ValueError("No se pudo abrir el sobre: no es para esta llave o fue alterado.")

    guardar_llave_sesion(id_pintura, llave_sesion)
    return {"abierto": True}
