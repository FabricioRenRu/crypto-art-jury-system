"""
/public/python/sobre_pintor_utils.py
Sobre del pintor: la llave AES de su obra cifrada con una llave que SOLO él puede derivar
(HKDF sobre el escalar privado d de su llave ECDSA). Así puede ver su obra después de un F5
o en otra computadora, y el servidor guarda el sobre sin poder abrirlo.
"""
import base64
import binascii
from typing import Any, Final, TypedDict, TypeVar, cast

from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import HKDF
from Crypto.PublicKey import ECC
from Crypto.Random import get_random_bytes
from Crypto.Util.number import long_to_bytes

from aes_utils import guardar_llave_sesion, obtener_llave_sesion
from session_utils import obtener_llave_actual, obtener_rol_actual

TAM_LLAVE_AES: Final[int] = 32
TAM_NONCE: Final[int] = 12
TAM_TAG: Final[int] = 16
TAM_SOBRE: Final[int] = TAM_NONCE + TAM_LLAVE_AES + TAM_TAG  # 60 bytes
SAL_HKDF: Final[bytes] = b"artclash-sobre-pintor-v1"


# ---- GENERAR_SOBRE_PINTOR ---------------------------------------------------
class PayloadGenerarSobrePintor(TypedDict):
    id_pintura: str          # la obra que se acaba de cifrar con CIFRAR_PINTURA


class ResultadoGenerarSobrePintor(TypedDict):
    sobre_pintor: str        # base64(nonce || AES-GCM(K_AES) || tag), 60 bytes


# ---- ABRIR_SOBRE_PINTOR -----------------------------------------------------
class PayloadAbrirSobrePintor(TypedDict):
    id_pintura: str
    sobre_pintor: str        # el que regresa GET /api/pinturas/mis-obras


class ResultadoAbrirSobrePintor(TypedDict):
    abierto: bool


T = TypeVar("T")


def _a_dict(valor: Any, _tipo: type[T]) -> T:
    to_py = getattr(valor, "to_py", None)
    return cast(T, to_py() if callable(to_py) else valor)


def _llave_del_sobre(id_pintura: str) -> bytes:
    """Llave AES-256 derivada de la llave privada ECDSA del pintor en sesión."""
    if obtener_rol_actual() != "pintor":
        raise ValueError("Solo el pintor puede usar el sobre de su obra.")
    llave_ecdsa: ECC.EccKey = ECC.import_key(obtener_llave_actual())
    material = HKDF(
        long_to_bytes(int(llave_ecdsa.d)), TAM_LLAVE_AES, SAL_HKDF, SHA256,
        context=f"sobre-pintor:{id_pintura}".encode("utf-8"),
    )
    return cast(bytes, material)


def _aad(id_pintura: str) -> bytes:
    return f"artclash:sobre-pintor:{id_pintura}".encode("utf-8")


def generar_sobre_pintor(payload_js: Any) -> ResultadoGenerarSobrePintor:
    """Envuelve la K_AES de la obra (que está en la sesión tras CIFRAR_PINTURA) para el propio pintor."""
    payload: PayloadGenerarSobrePintor = _a_dict(payload_js, PayloadGenerarSobrePintor)
    id_pintura: str = str(payload["id_pintura"])

    llave_obra: bytes | None = obtener_llave_sesion(id_pintura)
    if llave_obra is None:
        raise ValueError("Primero cifra la obra: no hay llave AES para esta pintura.")

    nonce: bytes = get_random_bytes(TAM_NONCE)
    cifrador = AES.new(_llave_del_sobre(id_pintura), AES.MODE_GCM, nonce=nonce, mac_len=TAM_TAG)
    cifrador.update(_aad(id_pintura))
    cifrado, tag = cifrador.encrypt_and_digest(llave_obra)
    return {"sobre_pintor": base64.b64encode(nonce + cifrado + tag).decode("ascii")}


def abrir_sobre_pintor(payload_js: Any) -> ResultadoAbrirSobrePintor:
    """Recupera K_AES del sobre y la deja en la sesión para que DESCIFRAR_PINTURA funcione."""
    payload: PayloadAbrirSobrePintor = _a_dict(payload_js, PayloadAbrirSobrePintor)
    id_pintura: str = str(payload["id_pintura"])
    try:
        sobre: bytes = base64.b64decode(payload["sobre_pintor"], validate=True)
        if len(sobre) != TAM_SOBRE:
            raise ValueError("Tamaño de sobre inválido.")
        descifrador = AES.new(
            _llave_del_sobre(id_pintura), AES.MODE_GCM, nonce=sobre[:TAM_NONCE], mac_len=TAM_TAG
        )
        descifrador.update(_aad(id_pintura))
        llave_obra: bytes = descifrador.decrypt_and_verify(sobre[TAM_NONCE:-TAM_TAG], sobre[-TAM_TAG:])
    except (ValueError, binascii.Error) as exc:
        raise ValueError("No se pudo abrir el sobre: no corresponde a tu llave o fue alterado.") from exc

    guardar_llave_sesion(id_pintura, llave_obra)
    return {"abierto": True}