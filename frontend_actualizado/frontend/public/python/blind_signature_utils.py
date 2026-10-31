"""
/public/python/blind_signature_utils.py
Firma ciega de Chaum (RSA) + firma RSA-PSS del juez. Corre en el worker (Pyodide).

Flujo:
  Juez        preparar_evaluacion_cegada  -> h' = h * r^e mod n  y su evaluación cifrada para sí mismo
  Presidente  blind_signature             -> s' = h'^d mod n
  Juez        preparar_publicacion        -> descifra su evaluación, s = s' * r^-1 mod n,
                                             verifica s^e mod n == h y firma con RSA-PSS
  Público     verificar_evaluacion_publica -> comprueba ambas firmas sin ninguna llave privada

h = FDH-SHA256(texto canónico de la evaluación), del tamaño del módulo n del presidente.
"""
import base64
import hashlib
import json
import math
from typing import Any

from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import HKDF
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Signature import pss
from Crypto.Util.number import bytes_to_long, long_to_bytes

from session_utils import obtener_llave_actual, obtener_llave_presidente, obtener_rol_actual

ESTRELLAS_VALIDAS = (1, 2, 3)
MAX_COMENTARIO = 1000
TAM_NONCE = 12
TAM_TAG = 16
SAL_HKDF = b"artclash-firma-ciega-v1"


# --------------------------------------------------------------------------- #
# Utilidades
# --------------------------------------------------------------------------- #
def _a_python(valor: Any) -> Any:
    return valor.to_py() if hasattr(valor, "to_py") else valor


def _b64(datos: bytes) -> str:
    return base64.b64encode(datos).decode("ascii")


def texto_evaluacion_canonico(id_pintura: str, id_juez: str, estrellas: int, comentario: str) -> str:
    """
    Texto EXACTO que se hashea y se firma. Debe ser idéntico al de backend/app/utils/crypto.py:
    JSON con llaves ordenadas, sin espacios y en UTF-8.
    """
    return json.dumps(
        {
            "tipo": "evaluacion_artclash",
            "version": 1,
            "id_pintura": str(id_pintura),
            "id_juez": str(id_juez),
            "estrellas": int(estrellas),
            "comentario": comentario.strip(),
        },
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


def _validar_evaluacion(estrellas: Any, comentario: Any) -> tuple[int, str]:
    if isinstance(estrellas, bool) or int(estrellas) not in ESTRELLAS_VALIDAS:
        raise ValueError("La calificación debe ser de 1 a 3 estrellas.")
    comentario = str(comentario or "").strip()
    if len(comentario) > MAX_COMENTARIO:
        raise ValueError(f"El comentario admite máximo {MAX_COMENTARIO} caracteres.")
    return int(estrellas), comentario


def _full_domain_hash(mensaje: bytes, bits_n: int) -> int:
    """
    FDH: expande SHA-256 (estilo MGF1) hasta cubrir el módulo n y lo deja menor que n.
    Debe ser idéntico al de backend/app/utils/crypto.py.
    """
    longitud = (bits_n + 7) // 8
    contador = 0
    derivado = b""
    while len(derivado) < longitud:
        derivado += hashlib.sha256(mensaje + contador.to_bytes(4, "big")).digest()
        contador += 1
    return bytes_to_long(derivado[:longitud]) % (1 << (bits_n - 1))


def _llave_juez() -> RSA.RsaKey:
    """Llave privada del juez en sesión. Bloquea a cualquier otro rol."""
    if obtener_rol_actual() != "jurado":
        raise ValueError("Solo un juez puede realizar esta operación.")
    return RSA.import_key(obtener_llave_actual())


def _derivar(llave_juez: RSA.RsaKey, contexto: str, longitud: int) -> bytes:
    """
    Deriva material secreto a partir del exponente privado d del juez (HKDF-SHA256).
    Usar d y no el texto del .pem hace que no importe cómo esté formateado el archivo.
    """
    return HKDF(long_to_bytes(llave_juez.d), longitud, SAL_HKDF, SHA256, context=contexto.encode("utf-8"))


def _factor_r(llave_juez: RSA.RsaKey, n: int, id_pintura: str) -> int:
    """
    Factor de cegado r: determinista por (juez, pintura) para poder recalcularlo después de un F5,
    secreto (depende de d del juez) y coprimo con n.
    """
    contador = 0
    while True:
        material = _derivar(llave_juez, f"r:{id_pintura}:{contador}", (n.bit_length() + 7) // 8 + 16)
        r = bytes_to_long(material) % n
        if r > 1 and math.gcd(r, n) == 1:
            return r
        contador += 1


def _aad_evaluacion(id_pintura: str, id_juez: str) -> bytes:
    return f"artclash:evaluacion:{id_pintura}:{id_juez}".encode("utf-8")


# --------------------------------------------------------------------------- #
# Paso 2: el juez ciega su evaluación
# --------------------------------------------------------------------------- #
def preparar_evaluacion_cegada(payload_js: Any) -> dict[str, str]:
    """
    Recibe {id_pintura, id_juez, estrellas, comentario}.
    Regresa h' (para el presidente) y la evaluación cifrada con una llave que solo el juez
    puede derivar (para recuperarla en el paso 8 aunque recargue la página).
    """
    payload = _a_python(payload_js)
    llave_juez = _llave_juez()
    id_pintura = str(payload["id_pintura"])
    id_juez = str(payload["id_juez"])
    estrellas, comentario = _validar_evaluacion(payload["estrellas"], payload["comentario"])

    texto = texto_evaluacion_canonico(id_pintura, id_juez, estrellas, comentario).encode("utf-8")

    presidente = obtener_llave_presidente()
    n, e = presidente.n, presidente.e
    h = _full_domain_hash(texto, n.bit_length())
    r = _factor_r(llave_juez, n, id_pintura)
    h_cegado = (h * pow(r, e, n)) % n  # h' = h * r^e mod n

    # AES-256-GCM con llave derivada del juez: el servidor guarda esto pero no lo puede abrir
    nonce = get_random_bytes(TAM_NONCE)
    cifrador = AES.new(_derivar(llave_juez, f"evaluacion:{id_pintura}", 32), AES.MODE_GCM, nonce=nonce, mac_len=TAM_TAG)
    cifrador.update(_aad_evaluacion(id_pintura, id_juez))
    cifrado, tag = cifrador.encrypt_and_digest(texto)

    return {
        "h_blinded": str(h_cegado),
        "evaluacion_cifrada": _b64(nonce + cifrado + tag),
    }


# --------------------------------------------------------------------------- #
# Paso 5: el presidente firma a ciegas
# --------------------------------------------------------------------------- #
def blind_signature(payload_js: Any) -> dict[str, str]:
    """
    s' = h'^d mod n. Es exponenciación RSA SIN relleno, por eso se restringe al presidente:
    con la llave de un juez esto equivaldría a descifrarle cualquier sobre.
    """
    if obtener_rol_actual() != "presidente":
        raise ValueError("Solo el presidente puede emitir firmas ciegas.")
    payload = _a_python(payload_js)
    llave = RSA.import_key(obtener_llave_actual())
    h_cegado = int(payload["h_blinded"])
    if not 1 < h_cegado < llave.n:
        raise ValueError("El hash cegado está fuera del rango de la llave.")
    return {"s_blinded": str(pow(h_cegado, llave.d, llave.n))}


# --------------------------------------------------------------------------- #
# Paso 8: el juez desciega, verifica y firma con PSS
# --------------------------------------------------------------------------- #
def preparar_publicacion(payload_js: Any) -> dict[str, Any]:
    """
    Recibe {id_pintura, id_juez, s_blinded, evaluacion_cifrada} (lo que regresa el backend en el paso 7).
    Regresa todo lo que se publica en el paso 9.
    """
    payload = _a_python(payload_js)
    llave_juez = _llave_juez()
    id_pintura = str(payload["id_pintura"])
    id_juez = str(payload["id_juez"])

    # 1. Recuperar la evaluación original
    try:
        paquete = base64.b64decode(payload["evaluacion_cifrada"], validate=True)
        if len(paquete) <= TAM_NONCE + TAM_TAG:
            raise ValueError
        descifrador = AES.new(
            _derivar(llave_juez, f"evaluacion:{id_pintura}", 32), AES.MODE_GCM,
            nonce=paquete[:TAM_NONCE], mac_len=TAM_TAG,
        )
        descifrador.update(_aad_evaluacion(id_pintura, id_juez))
        texto = descifrador.decrypt_and_verify(paquete[TAM_NONCE:-TAM_TAG], paquete[-TAM_TAG:])
    except (ValueError, KeyError) as exc:
        raise ValueError("No se pudo recuperar tu evaluación: no corresponde a tu llave o fue alterada.") from exc

    datos = json.loads(texto.decode("utf-8"))
    if datos.get("id_pintura") != id_pintura or datos.get("id_juez") != id_juez:
        raise ValueError("La evaluación recuperada no corresponde a esta pintura.")
    estrellas, comentario = _validar_evaluacion(datos["estrellas"], datos["comentario"])
    texto_canonico = texto_evaluacion_canonico(id_pintura, id_juez, estrellas, comentario)
    if texto_canonico.encode("utf-8") != texto:
        raise ValueError("La evaluación recuperada no está en formato canónico.")

    # 2. Descegar: s = s' * r^-1 mod n
    presidente = obtener_llave_presidente()
    n, e = presidente.n, presidente.e
    h = _full_domain_hash(texto, n.bit_length())
    r = _factor_r(llave_juez, n, id_pintura)
    s = (int(payload["s_blinded"]) * pow(r, -1, n)) % n

    # 3. Verificar antes de publicar: s^e mod n == h
    if pow(s, e, n) != h:
        raise ValueError("La firma del presidente no corresponde a tu evaluación.")

    # 4. Firma propia del juez (no repudio), RSA-PSS con SHA-256
    firma_juez = pss.new(llave_juez).sign(SHA256.new(texto))

    return {
        "estrellas": estrellas,
        "comentario": comentario,
        "texto_canonico": texto_canonico,
        "hash_original": str(h),
        "firma_descegada": str(s),
        "firma_juez": _b64(firma_juez),
    }


# --------------------------------------------------------------------------- #
# Paso 10: verificación pública (no usa ninguna llave privada ni la sesión)
# --------------------------------------------------------------------------- #
def verificar_evaluacion_publica(payload_js: Any) -> dict[str, Any]:
    """
    Recibe una evaluación del tablero público + las llaves públicas del juez y del presidente.
    Recalcula el texto canónico desde los campos y comprueba ambas firmas.
    """
    p = _a_python(payload_js)
    texto = texto_evaluacion_canonico(p["id_pintura"], p["id_juez"], p["estrellas"], p["comentario"])
    mensaje = texto.encode("utf-8")

    presidente = RSA.import_key(p["clave_publica_presidente"]).publickey()
    n, e = presidente.n, presidente.e
    h = _full_domain_hash(mensaje, n.bit_length())
    s = int(p["firma_descegada"])
    firma_presidente_valida = 0 < s < n and pow(s, e, n) == h

    try:
        juez = RSA.import_key(p["clave_publica_juez"]).publickey()
        pss.new(juez).verify(SHA256.new(mensaje), base64.b64decode(p["firma_juez"], validate=True))
        firma_juez_valida = True
    except (ValueError, TypeError):
        firma_juez_valida = False

    return {
        "texto_coincide": texto == p["texto_canonico"],
        "hash_recalculado": str(h),
        "firma_presidente_valida": firma_presidente_valida,
        "firma_juez_valida": firma_juez_valida,
    }