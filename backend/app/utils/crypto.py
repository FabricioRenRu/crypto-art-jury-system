"""Primitivas del backend: llaves ECDSA, verificación de firmas, hashes y firma ciega."""
import base64
import binascii
import hashlib
import json
from typing import Final

from Crypto.Hash import SHA256
from Crypto.PublicKey import ECC, RSA
from Crypto.Signature import DSS, pss
from Crypto.Util.number import bytes_to_long
from Crypto.Cipher import AES

PREFIJO_AAD_OBRA: Final[str] = "concurso-pintura:obra:"
LONGITUD_NONCE: Final[int] = 12
LONGITUD_TAG: Final[int] = 16
BITS_MINIMOS_LLAVE: Final[int] = 2048


def generar_par_ecdsa() -> tuple[str, str]:
    """Devuelve (privada_pem, publica_pem) en curva P-256."""
    llave: ECC.EccKey = ECC.generate(curve="P-256")
    return (
        llave.export_key(format="PEM"),
        llave.public_key().export_key(format="PEM"),
    )


def verificar_ecdsa(publica_pem: str, mensaje: bytes, firma_hex: str) -> bool:
    try:
        llave: ECC.EccKey = ECC.import_key(publica_pem)
        DSS.new(llave, "fips-186-3").verify(SHA256.new(mensaje), bytes.fromhex(firma_hex))
        return True
    except (ValueError, TypeError):
        return False


def sha256_hex(datos: bytes) -> str:
    return hashlib.sha256(datos).hexdigest()


def bits_llave_publica(llave_publica_pem: str) -> int:
    """Tamano del modulo n en bits, o 0 si el PEM no es una llave publica RSA valida."""
    try:
        llave = RSA.import_key(llave_publica_pem)
    except (ValueError, IndexError, TypeError):
        return 0
    if llave.has_private():
        # Nunca se publica una llave privada por error
        return 0
    return llave.size_in_bits()



# ===========Firma ciega (Chaum) y firma RSA-PSS del juez

def texto_evaluacion_canonico(id_pintura, id_juez, estrellas: int, comentario: str) -> str:
    """Texto EXACTO que se firma. Debe ser idéntico al de public/python/blind_signature_utils.py."""
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


def full_domain_hash(mensaje: bytes, bits_n: int) -> int:
    """FDH-SHA256. Debe ser idéntico al de public/python/blind_signature_utils.py."""
    longitud = (bits_n + 7) // 8
    contador = 0
    derivado = b""
    while len(derivado) < longitud:
        derivado += hashlib.sha256(mensaje + contador.to_bytes(4, "big")).digest()
        contador += 1
    return bytes_to_long(derivado[:longitud]) % (1 << (bits_n - 1))


def _llave_publica_rsa(pem: str) -> RSA.RsaKey:
    return RSA.import_key(pem).publickey()


def numero_en_rango(valor_decimal: str, llave_publica_pem: str) -> bool:
    """True si 1 < valor < n (un h' o s' que tenga sentido para esa llave)."""
    n = _llave_publica_rsa(llave_publica_pem).n
    return 1 < int(valor_decimal) < n


def verificar_firma_ciega(h_cegado: str, s_cegada: str, llave_publica_pem: str) -> bool:
    """Paso 6: comprueba s'^e mod n == h' antes de aceptar la firma del presidente."""
    llave = _llave_publica_rsa(llave_publica_pem)
    s = int(s_cegada)
    return 0 < s < llave.n and pow(s, llave.e, llave.n) == int(h_cegado) % llave.n


def verificar_firma_presidente(mensaje: bytes, firma_decimal: str, llave_publica_pem: str) -> tuple[bool, int]:
    """Paso 9/10: comprueba s^e mod n == FDH(mensaje). Regresa (valida, h)."""
    llave = _llave_publica_rsa(llave_publica_pem)
    h = full_domain_hash(mensaje, llave.n.bit_length())
    s = int(firma_decimal)
    return (0 < s < llave.n and pow(s, llave.e, llave.n) == h), h


def verificar_pss(llave_publica_pem: str, mensaje: bytes, firma_b64: str) -> bool:
    """Firma RSA-PSS (SHA-256) del juez sobre su evaluación."""
    try:
        llave = _llave_publica_rsa(llave_publica_pem)
        pss.new(llave).verify(SHA256.new(mensaje), base64.b64decode(firma_b64, validate=True))
        return True
    except (ValueError, TypeError, binascii.Error):
        return False


def es_base64(valor: str) -> bool:
    try:
        base64.b64decode(valor, validate=True)
        return True
    except (binascii.Error, ValueError):
        return False

def llave_abre_obra(llave: bytes, paquete: bytes, id_pintura) -> bool:
    """
    True si K_AES descifra y autentica el paquete nonce||ciphertext||tag de esa obra.
    Se usa en la revelación: el tag de AES-GCM prueba que la llave es la correcta.
    """
    if len(llave) != 32 or len(paquete) <= LONGITUD_NONCE + LONGITUD_TAG:
        return False
    try:
        descifrador = AES.new(llave, AES.MODE_GCM, nonce=paquete[:LONGITUD_NONCE], mac_len=LONGITUD_TAG)
        descifrador.update((PREFIJO_AAD_OBRA + str(id_pintura)).encode("utf-8"))
        descifrador.decrypt_and_verify(paquete[LONGITUD_NONCE:-LONGITUD_TAG], paquete[-LONGITUD_TAG:])
        return True
    except ValueError:
        return False