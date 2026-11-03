"""
/public/python/blind_signature_utils.py
Firma ciega de Chaum (RSA) + firma RSA-PSS del juez. Corre en el worker (Pyodide).

Flujo:
  Juez        preparar_evaluacion_cegada   -> h' = h * r^e mod n  y su evaluación cifrada para sí mismo
  Presidente  blind_signature              -> s' = h'^d mod n
  Juez        preparar_publicacion         -> descifra su evaluación, s = s' * r^-1 mod n,
                                              verifica s^e mod n == h y firma con RSA-PSS
  Público     verificar_evaluacion_publica -> comprueba ambas firmas sin ninguna llave privada

h = FDH-SHA256(texto canónico de la evaluación), del tamaño del módulo n del presidente.

Sobre los tipos: cada función pública recibe lo que manda React a través del worker.
pyodide.toPy() ya lo convierte en dict, pero por si llega como JsProxy se pasa por _a_dict().
Los TypedDict de abajo documentan EXACTAMENTE qué trae cada payload y qué regresa cada función.
"""
import base64
import binascii
import hashlib
import json
import math
from typing import Any, Final, TypedDict, TypeVar, cast

from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import HKDF
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Signature import pss
from Crypto.Util.number import bytes_to_long, long_to_bytes

from session_utils import obtener_llave_actual, obtener_llave_presidente, obtener_rol_actual
from aes_utils import obtener_llave_sesion

ESTRELLAS_VALIDAS: Final[tuple[int, ...]] = (1, 2, 3)
MAX_COMENTARIO: Final[int] = 1000
TAM_NONCE: Final[int] = 12
TAM_TAG: Final[int] = 16
TAM_LLAVE_AES: Final[int] = 32
SAL_HKDF: Final[bytes] = b"artclash-firma-ciega-v1"


# =========================================================================== #
# Payloads (lo que llega desde React) y resultados (lo que regresa a React)
# =========================================================================== #
class EvaluacionCanonica(TypedDict):
    """Contenido del texto canónico que se hashea y se firma."""
    tipo: str          # siempre "evaluacion_artclash"
    version: int       # siempre 1
    id_pintura: str    # UUID
    id_juez: str       # UUID (el "sub" del JWT del juez)
    estrellas: int     # 1, 2 o 3
    comentario: str    # sin espacios al inicio/fin, máx. 1000 caracteres


# ---- Paso 2: CEGAR_EVALUACION (juez) ---------------------------------------
class PayloadEvaluacionCegada(TypedDict):
    id_pintura: str
    id_juez: str
    estrellas: int
    comentario: str


class ResultadoEvaluacionCegada(TypedDict):
    h_blinded: str           # h' en decimal -> se sube como hash_cegado
    evaluacion_cifrada: str  # base64(nonce || AES-GCM(texto) || tag) -> se sube tal cual


# ---- Paso 5: FIRMA_CIEGA (presidente) --------------------------------------
class PayloadFirmaCiega(TypedDict):
    h_blinded: str           # h' en decimal (viene de la bandeja del presidente)


class ResultadoFirmaCiega(TypedDict):
    s_blinded: str           # s' en decimal -> se sube como firma_ciega_presi


# ---- Paso 8: PREPARAR_PUBLICACION (juez) -----------------------------------
class PayloadPublicacion(TypedDict):
    id_pintura: str
    id_juez: str
    s_blinded: str           # s' (firma_ciega_presi del paso 7)
    evaluacion_cifrada: str  # la misma que se subió en el paso 3


class ResultadoPublicacion(TypedDict):
    estrellas: int
    comentario: str
    texto_canonico: str      # texto exacto que se firmó
    hash_original: str       # h en decimal
    firma_descegada: str     # s en decimal (firma del presidente)
    firma_juez: str          # RSA-PSS del juez, base64
    llave_aes: str 


# ---- Paso 10: VERIFICAR_EVALUACION_PUBLICA (cualquiera) --------------------
class PayloadVerificacionPublica(TypedDict):
    id_pintura: str
    id_juez: str
    estrellas: int
    comentario: str
    texto_canonico: str
    firma_descegada: str
    firma_juez: str
    clave_publica_juez: str        # PEM
    clave_publica_presidente: str  # PEM


class ResultadoVerificacionPublica(TypedDict):
    texto_coincide: bool
    hash_recalculado: str
    firma_presidente_valida: bool
    firma_juez_valida: bool


# =========================================================================== #
# Utilidades
# =========================================================================== #
T = TypeVar("T")


def _a_dict(valor: Any, _tipo: type[T]) -> T:
    """Convierte el payload que llega del worker (dict o JsProxy) al TypedDict indicado."""
    to_py = getattr(valor, "to_py", None)
    return cast(T, to_py() if callable(to_py) else valor)


def _b64(datos: bytes) -> str:
    return base64.b64encode(datos).decode("ascii")


def texto_evaluacion_canonico(id_pintura: str, id_juez: str, estrellas: int, comentario: str) -> str:
    """
    Texto EXACTO que se hashea y se firma. Debe ser idéntico al de backend/app/utils/crypto.py:
    JSON con llaves ordenadas, sin espacios y en UTF-8.
    """
    evaluacion: EvaluacionCanonica = {
        "tipo": "evaluacion_artclash",
        "version": 1,
        "id_pintura": str(id_pintura),
        "id_juez": str(id_juez),
        "estrellas": int(estrellas),
        "comentario": comentario.strip(),
    }
    return json.dumps(evaluacion, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _validar_evaluacion(estrellas: object, comentario: object) -> tuple[int, str]:
    """Regresa (estrellas, comentario) normalizados o lanza ValueError."""
    if isinstance(estrellas, bool) or not isinstance(estrellas, (int, str)):
        raise ValueError("La calificación debe ser de 1 a 3 estrellas.")
    estrellas_int: int = int(estrellas)
    if estrellas_int not in ESTRELLAS_VALIDAS:
        raise ValueError("La calificación debe ser de 1 a 3 estrellas.")
    comentario_limpio: str = str(comentario or "").strip()
    if len(comentario_limpio) > MAX_COMENTARIO:
        raise ValueError(f"El comentario admite máximo {MAX_COMENTARIO} caracteres.")
    return estrellas_int, comentario_limpio


def _full_domain_hash(mensaje: bytes, bits_n: int) -> int:
    """
    FDH: expande SHA-256 (estilo MGF1) hasta cubrir el módulo n y lo deja menor que n.
    Debe ser idéntico al de backend/app/utils/crypto.py.
    """
    longitud: int = (bits_n + 7) // 8
    contador: int = 0
    derivado: bytes = b""
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
    material = HKDF(long_to_bytes(llave_juez.d), longitud, SAL_HKDF, SHA256, context=contexto.encode("utf-8"))
    return cast(bytes, material)


def _factor_r(llave_juez: RSA.RsaKey, n: int, id_pintura: str) -> int:
    """
    Factor de cegado r: determinista por (juez, pintura) para poder recalcularlo después de un F5,
    secreto (depende de d del juez) y coprimo con n.
    """
    contador: int = 0
    while True:
        material: bytes = _derivar(llave_juez, f"r:{id_pintura}:{contador}", (n.bit_length() + 7) // 8 + 16)
        r: int = bytes_to_long(material) % n
        if r > 1 and math.gcd(r, n) == 1:
            return r
        contador += 1


def _llave_evaluacion(llave_juez: RSA.RsaKey, id_pintura: str) -> bytes:
    """Llave AES-256 con la que el juez cifra su propia evaluación de esa pintura."""
    return _derivar(llave_juez, f"evaluacion:{id_pintura}", TAM_LLAVE_AES)


def _aad_evaluacion(id_pintura: str, id_juez: str) -> bytes:
    """Datos asociados de AES-GCM: amarran el cifrado a la pintura y al juez."""
    return f"artclash:evaluacion:{id_pintura}:{id_juez}".encode("utf-8")


# =========================================================================== #
# Paso 2: el juez ciega su evaluación
# =========================================================================== #
def preparar_evaluacion_cegada(payload_js: Any) -> ResultadoEvaluacionCegada:
    """
    Regresa h' (para el presidente) y la evaluación cifrada con una llave que solo el juez
    puede derivar (para recuperarla en el paso 8 aunque recargue la página).
    """
    payload: PayloadEvaluacionCegada = _a_dict(payload_js, PayloadEvaluacionCegada)
    llave_juez: RSA.RsaKey = _llave_juez()
    id_pintura: str = str(payload["id_pintura"])
    id_juez: str = str(payload["id_juez"])
    estrellas, comentario = _validar_evaluacion(payload["estrellas"], payload["comentario"])

    texto: bytes = texto_evaluacion_canonico(id_pintura, id_juez, estrellas, comentario).encode("utf-8")

    presidente: RSA.RsaKey = obtener_llave_presidente()
    n: int = presidente.n
    e: int = presidente.e
    h: int = _full_domain_hash(texto, n.bit_length())
    r: int = _factor_r(llave_juez, n, id_pintura)
    h_cegado: int = (h * pow(r, e, n)) % n  # h' = h * r^e mod n

    # AES-256-GCM con llave derivada del juez: el servidor guarda esto pero no lo puede abrir
    nonce: bytes = get_random_bytes(TAM_NONCE)
    cifrador = AES.new(_llave_evaluacion(llave_juez, id_pintura), AES.MODE_GCM, nonce=nonce, mac_len=TAM_TAG)
    cifrador.update(_aad_evaluacion(id_pintura, id_juez))
    cifrado, tag = cifrador.encrypt_and_digest(texto)

    return {
        "h_blinded": str(h_cegado),
        "evaluacion_cifrada": _b64(nonce + cifrado + tag),
    }


# =========================================================================== #
# Paso 5: el presidente firma a ciegas
# =========================================================================== #
def blind_signature(payload_js: Any) -> ResultadoFirmaCiega:
    """
    s' = h'^d mod n. Es exponenciación RSA SIN relleno, por eso se restringe al presidente:
    con la llave de un juez esto equivaldría a descifrarle cualquier sobre.
    """
    if obtener_rol_actual() != "presidente":
        raise ValueError("Solo el presidente puede emitir firmas ciegas.")
    payload: PayloadFirmaCiega = _a_dict(payload_js, PayloadFirmaCiega)
    llave: RSA.RsaKey = RSA.import_key(obtener_llave_actual())
    h_cegado: int = int(payload["h_blinded"])
    if not 1 < h_cegado < llave.n:
        raise ValueError("El hash cegado está fuera del rango de la llave.")
    return {"s_blinded": str(pow(h_cegado, llave.d, llave.n))}


# =========================================================================== #
# Paso 8: el juez desciega, verifica y firma con PSS
# =========================================================================== #
def _recuperar_evaluacion(llave_juez: RSA.RsaKey, payload: PayloadPublicacion) -> bytes:
    """Descifra la evaluación que el juez subió en el paso 3 (texto canónico en bytes)."""
    id_pintura: str = str(payload["id_pintura"])
    id_juez: str = str(payload["id_juez"])
    try:
        paquete: bytes = base64.b64decode(payload["evaluacion_cifrada"], validate=True)
        if len(paquete) <= TAM_NONCE + TAM_TAG:
            raise ValueError("Paquete demasiado corto.")
        descifrador = AES.new(
            _llave_evaluacion(llave_juez, id_pintura), AES.MODE_GCM,
            nonce=paquete[:TAM_NONCE], mac_len=TAM_TAG,
        )
        descifrador.update(_aad_evaluacion(id_pintura, id_juez))
        return descifrador.decrypt_and_verify(paquete[TAM_NONCE:-TAM_TAG], paquete[-TAM_TAG:])
    except (ValueError, KeyError, binascii.Error) as exc:
        raise ValueError("No se pudo recuperar tu evaluación: no corresponde a tu llave o fue alterada.") from exc


def preparar_publicacion(payload_js: Any) -> ResultadoPublicacion:
    """Regresa todo lo que se publica en el paso 9."""
    payload: PayloadPublicacion = _a_dict(payload_js, PayloadPublicacion)
    llave_juez: RSA.RsaKey = _llave_juez()
    id_pintura: str = str(payload["id_pintura"])
    id_juez: str = str(payload["id_juez"])

    # 1. Recuperar la evaluación original y comprobar que sea de esta pintura y este juez
    texto: bytes = _recuperar_evaluacion(llave_juez, payload)
    datos: EvaluacionCanonica = cast(EvaluacionCanonica, json.loads(texto.decode("utf-8")))
    if datos.get("id_pintura") != id_pintura or datos.get("id_juez") != id_juez:
        raise ValueError("La evaluación recuperada no corresponde a esta pintura.")
    estrellas, comentario = _validar_evaluacion(datos["estrellas"], datos["comentario"])
    texto_canonico: str = texto_evaluacion_canonico(id_pintura, id_juez, estrellas, comentario)
    if texto_canonico.encode("utf-8") != texto:
        raise ValueError("La evaluación recuperada no está en formato canónico.")

    # 2. Descegar: s = s' * r^-1 mod n
    presidente: RSA.RsaKey = obtener_llave_presidente()
    n: int = presidente.n
    e: int = presidente.e
    h: int = _full_domain_hash(texto, n.bit_length())
    r: int = _factor_r(llave_juez, n, id_pintura)
    s: int = (int(payload["s_blinded"]) * pow(r, -1, n)) % n

    # 3. Verificar antes de publicar: s^e mod n == h
    if pow(s, e, n) != h:
        raise ValueError("La firma del presidente no corresponde a tu evaluación.")

    # 4. Firma propia del juez (no repudio), RSA-PSS con SHA-256
    firma_juez: bytes = pss.new(llave_juez).sign(SHA256.new(texto))

    # 5. K_AES de la obra (revelación). El worker la tiene porque el juez abrió su sobre al cargar la mesa
    llave_aes: bytes | None = obtener_llave_sesion(id_pintura)
    if llave_aes is None:
        raise ValueError("Primero abre la obra (recarga la mesa de calificación) para poder publicar.")

    return {
        "estrellas": estrellas,
        "comentario": comentario,
        "texto_canonico": texto_canonico,
        "hash_original": str(h),
        "firma_descegada": str(s),
        "firma_juez": _b64(firma_juez),
        "llave_aes": _b64(llave_aes),
    }


# =========================================================================== #
# Paso 10: verificación pública (no usa ninguna llave privada ni la sesión)
# =========================================================================== #
def verificar_evaluacion_publica(payload_js: Any) -> ResultadoVerificacionPublica:
    """Recalcula el texto canónico desde los campos publicados y comprueba ambas firmas."""
    p: PayloadVerificacionPublica = _a_dict(payload_js, PayloadVerificacionPublica)
    texto: str = texto_evaluacion_canonico(p["id_pintura"], p["id_juez"], p["estrellas"], p["comentario"])
    mensaje: bytes = texto.encode("utf-8")

    # Firma del presidente: s^e mod n == FDH(mensaje)
    presidente: RSA.RsaKey = RSA.import_key(p["clave_publica_presidente"]).publickey()
    n: int = presidente.n
    e: int = presidente.e
    h: int = _full_domain_hash(mensaje, n.bit_length())
    s: int = int(p["firma_descegada"])
    firma_presidente_valida: bool = 0 < s < n and pow(s, e, n) == h

    # Firma del juez: RSA-PSS sobre el mismo mensaje
    firma_juez_valida: bool
    try:
        juez: RSA.RsaKey = RSA.import_key(p["clave_publica_juez"]).publickey()
        pss.new(juez).verify(SHA256.new(mensaje), base64.b64decode(p["firma_juez"], validate=True))
        firma_juez_valida = True
    except (ValueError, TypeError, binascii.Error):
        firma_juez_valida = False

    return {
        "texto_coincide": texto == p["texto_canonico"],
        "hash_recalculado": str(h),
        "firma_presidente_valida": firma_presidente_valida,
        "firma_juez_valida": firma_juez_valida,
    }