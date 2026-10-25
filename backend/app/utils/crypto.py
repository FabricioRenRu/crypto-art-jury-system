"""
app/utils/crypto.py
Primitivas criptograficas del backend (PyCryptodome + hashlib).

Formatos (identicos a los que ya usaba el frontend / Pyodide):
  - ECDSA: curva P-256, SHA-256, modo 'fips-186-3', firma = r||s en hexadecimal,
    llave publica en PEM (SubjectPublicKeyInfo).
  - La llave privada del pintor NUNCA se guarda: la descarga el usuario y la sube al iniciar
    sesion; el servidor solo la mantiene en RAM durante la sesion (ver key_vault.py).
  - AES-256-GCM: nonce de 12 bytes, tag de 16 bytes.
        archivo cifrado = nonce(12) || ciphertext || tag(16)
  - Sobre de llave: RSA-OAEP (SHA-256 / MGF1-SHA-256) con etiqueta
        b"concurso-pintura:obra:<id_pintura>"   (igual que ALGORITMO_RSA_OAEP/sobre_llave.py)
"""
import base64
import hashlib
import secrets
from typing import Final

from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import HKDF
from Crypto.PublicKey import ECC, RSA
from Crypto.Signature import DSS

LONGITUD_NONCE: Final[int] = 12
LONGITUD_TAG: Final[int] = 16
LONGITUD_LLAVE_AES: Final[int] = 32

_CONTEXTO_SOBRE_PINTOR: Final[bytes] = b"concurso-pintura:sobre-pintor:v1"
_PREFIJO_ETIQUETA_OAEP: Final[str] = "concurso-pintura:obra:"



def _b64(datos: bytes) -> str:
    return base64.b64encode(datos).decode("ascii")


def _unb64(texto: str) -> bytes:
    return base64.b64decode(texto, validate=True)


# --------------------------------------------------------------------------- #
# ECDSA
# --------------------------------------------------------------------------- #
def generar_par_ecdsa() -> tuple[str, str]:
    """Devuelve (privada_pem, publica_pem) en curva P-256."""
    llave: ECC.EccKey = ECC.generate(curve="P-256")
    return (
        llave.export_key(format="PEM"),
        llave.public_key().export_key(format="PEM"),
    )


def firmar_ecdsa(privada_pem: str, mensaje: bytes) -> str:
    llave: ECC.EccKey = ECC.import_key(privada_pem)
    firma: bytes = DSS.new(llave, "fips-186-3").sign(SHA256.new(mensaje))
    return firma.hex()


def verificar_ecdsa(publica_pem: str, mensaje: bytes, firma_hex: str) -> bool:
    try:
        llave: ECC.EccKey = ECC.import_key(publica_pem)
        DSS.new(llave, "fips-186-3").verify(SHA256.new(mensaje), bytes.fromhex(firma_hex))
        return True
    except (ValueError, TypeError):
        return False


def publica_de_privada(privada_pem: str) -> str:
    """
    Valida que `privada_pem` sea una llave privada ECDSA P-256 y devuelve su publica en PEM.
    Lanza ValueError si el archivo no es una llave privada P-256 valida.
    """
    try:
        llave: ECC.EccKey = ECC.import_key(privada_pem)
    except (ValueError, IndexError, TypeError) as exc:
        raise ValueError("El archivo no es una llave privada PEM valida") from exc
    if not llave.has_private() or llave.curve not in ("NIST P-256", "P-256", "secp256r1"):
        raise ValueError("Se requiere una llave privada ECDSA de la curva P-256")
    return llave.public_key().export_key(format="PEM")


def mismas_publicas(pem_a: str, pem_b: str) -> bool:
    """Compara dos llaves publicas ignorando diferencias de formato/espacios."""
    try:
        return ECC.import_key(pem_a).public_key() == ECC.import_key(pem_b).public_key()
    except (ValueError, IndexError, TypeError):
        return False


# --------------------------------------------------------------------------- #
# AES-256-GCM de la pintura
# --------------------------------------------------------------------------- #
def generar_llave_aes() -> bytes:
    return secrets.token_bytes(LONGITUD_LLAVE_AES)


def cifrar_aes_gcm(llave: bytes, claro: bytes, aad: bytes) -> bytes:
    """Devuelve nonce(12) || ciphertext || tag(16)."""
    nonce: bytes = secrets.token_bytes(LONGITUD_NONCE)
    cifrador = AES.new(llave, AES.MODE_GCM, nonce=nonce, mac_len=LONGITUD_TAG)
    cifrador.update(aad)
    cifrado, tag = cifrador.encrypt_and_digest(claro)
    return nonce + cifrado + tag


def descifrar_aes_gcm(llave: bytes, paquete: bytes, aad: bytes) -> bytes:
    """Inversa de cifrar_aes_gcm. Lanza ValueError si el tag no coincide (archivo alterado)."""
    if len(paquete) < LONGITUD_NONCE + LONGITUD_TAG:
        raise ValueError("Paquete AES-GCM demasiado corto")
    nonce = paquete[:LONGITUD_NONCE]
    cifrado = paquete[LONGITUD_NONCE:-LONGITUD_TAG]
    tag = paquete[-LONGITUD_TAG:]
    cifrador = AES.new(llave, AES.MODE_GCM, nonce=nonce, mac_len=LONGITUD_TAG)
    cifrador.update(aad)
    return cifrador.decrypt_and_verify(cifrado, tag)


def aad_obra(id_pintura: str) -> bytes:
    """
    Datos autenticados de la pintura. Solo contienen el id de la obra (nunca el del
    pintor) para que el juez pueda reconstruirlos sin romper el anonimato.
    """
    return (_PREFIJO_ETIQUETA_OAEP + str(id_pintura)).encode("utf-8")


# --------------------------------------------------------------------------- #
# Sobres de llave
# --------------------------------------------------------------------------- #
def envolver_llave_para_juez(llave_aes: bytes, rsa_publica_pem: str, id_pintura: str) -> str:
    """CK = RSA-OAEP(PK_juez, K_AES), amarrado a la obra mediante la etiqueta OAEP."""
    cifrador = PKCS1_OAEP.new(
        RSA.import_key(rsa_publica_pem), hashAlgo=SHA256, label=aad_obra(id_pintura)
    )
    return _b64(cifrador.encrypt(llave_aes))


def _llave_sobre_pintor(privada_pem: str) -> bytes:
    """
    Llave que protege la copia de K_AES que conserva el propio pintor. Se deriva de su
    llave privada ECDSA, que el servidor solo tiene en RAM mientras dura su sesion; en la BD
    solo queda el sobre cifrado, que sin esa llave no se puede abrir.
    """
    escalar: bytes = int(ECC.import_key(privada_pem).d).to_bytes(32, "big")
    return HKDF(escalar, 32, b"", SHA256, context=_CONTEXTO_SOBRE_PINTOR)


def envolver_llave_para_pintor(llave_aes: bytes, privada_pem: str, id_pintura: str) -> str:
    paquete = cifrar_aes_gcm(_llave_sobre_pintor(privada_pem), llave_aes, aad_obra(id_pintura))
    return _b64(paquete)


def desenvolver_llave_para_pintor(sobre_b64: str, privada_pem: str, id_pintura: str) -> bytes:
    return descifrar_aes_gcm(
        _llave_sobre_pintor(privada_pem), _unb64(sobre_b64), aad_obra(id_pintura)
    )


def sha256_hex(datos: bytes) -> str:
    return hashlib.sha256(datos).hexdigest()
