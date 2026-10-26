"""
/public/python/rsa_utils.py
RSA-OAEP (RFC 8017) con SHA-256 y MGF1-SHA-256 para los sobres de llave.
Usa PyCryptodome porque es la libreria que el worker ya carga en Pyodide.
"""

from Crypto.Cipher import PKCS1_OAEP
from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA
from Crypto.Signature import pss

BITS_MINIMOS_LLAVE = 2048


def generar_rsa(payload):
    # Genera la llave privada (toma menos de 1 segundo)
    llave = RSA.generate(2048)

    # Exportamos ambas en formato PEM (el estándar para guardar llaves)
    privada_pem = llave.export_key().decode('utf-8')
    publica_pem = llave.publickey().export_key().decode('utf-8')

    return {
        "privada": privada_pem,
        "publica": publica_pem
    }


def crear_relleno_oaep(llave, etiqueta):
    # RSA-OAEP del RFC 8017
    return PKCS1_OAEP.new(
        llave,
        hashAlgo=SHA256,  # hash de OAEP: SHA-256
        mgfunc=lambda semilla, longitud: pss.MGF1(semilla, longitud, SHA256),  # MGF1 con SHA-256
        label=etiqueta,  # etiqueta de la obra
    )


def cargar_llave_publica_pem(llave_publica_pem):
    try:
        llave = RSA.import_key(llave_publica_pem)
    except (ValueError, IndexError, TypeError):
        return None

    if llave.has_private():
        return None
    if llave.size_in_bits() < BITS_MINIMOS_LLAVE:
        return None
    return llave


def cargar_llave_privada_pem(llave_privada_pem):
    try:
        llave = RSA.import_key(llave_privada_pem)
    except (ValueError, IndexError, TypeError):
        return None

    if not llave.has_private():
        return None
    return llave


def cifrar_oaep(mensaje, llave_publica_pem, etiqueta=b""):
    llave = cargar_llave_publica_pem(llave_publica_pem)
    if llave is None:
        return None

    try:
        return crear_relleno_oaep(llave, etiqueta).encrypt(mensaje)
    except ValueError:
        # Mensaje demasiado largo para el bloque (maximo 190 bytes con RSA-2048 y SHA-256)
        return None


def descifrar_oaep(cifrado, llave_privada_pem, etiqueta=b""):
    llave = cargar_llave_privada_pem(llave_privada_pem)
    if llave is None:
        return None

    try:
        return crear_relleno_oaep(llave, etiqueta).decrypt(cifrado)
    except ValueError:
        # Sobre alterado, llave equivocada o etiqueta de otra obra
        return None
