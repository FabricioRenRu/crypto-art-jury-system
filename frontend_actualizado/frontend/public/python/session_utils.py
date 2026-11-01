"""
public/python/session_utils.py
"""
from typing import TypedDict, Any
from Crypto.PublicKey import ECC
from Crypto.PublicKey import RSA
from aes_utils import limpiar_llaves_sesion

class PayloadLlave(TypedDict):
    pem: str
    rol: str

class PayloadLlavePresidente(TypedDict):
    pem: str


estado_sesion: dict[str, str] = {
    "llave_privada_pem": None,
    "rol": None,
    "llave_publica_presidente": None,
}



def inyectar_llave_privada(payload_js: Any) -> dict[str, str]:
    """
    Guarda la llave privada del usuario (pintor, juez o presidente) en la variable global y confirma exito
    """
    payload: PayloadLlave = payload_js.to_py() if hasattr(payload_js, "to_py") else payload_js
    if payload["rol"] == "pintor":
        llave = ECC.import_key(payload["pem"])
        if not llave.has_private() or llave.curve not in ("NIST P-256", "P-256", "secp256r1"):
            raise ValueError("Se requiere una llave privada ECDSA P-256 válida.")
    else:
        llave = RSA.import_key(payload["pem"])
        if not llave.has_private():
            raise ValueError("Se requiere una llave privada RSA válida.")
    limpiar_llaves_sesion()
    estado_sesion["llave_publica_presidente"] = None
    estado_sesion["llave_privada_pem"] = payload["pem"]
    estado_sesion["rol"] = payload["rol"]
    
    # Retornamos un mensaje para que React sepa que ya puede avanzar
    return {
        "status": "exito", 
        "mensaje": "Llave blindada en RAM exitosamente."
    }

def inyectar_llave_presidente(payload_js: Any) -> dict[str, str]:
    """
    Guatda la llave publica del presidente en la variable global y confirma exito
    """
    payload: PayloadLlavePresidente = payload_js.to_py() if hasattr(payload_js, "to_py") else payload_js

    # Verificar que el .pem venga en el payload
    pem_str: str = payload.get("pem")
    if not pem_str:
        raise ValueError("El payload no contiene la propiedad 'pem'.")

    # Importar y validar la llave
    try:
        llave: RSA.RsaKey = RSA.import_key(pem_str)
    except (ValueError, IndexError, TypeError) as e:
        raise ValueError(f"Formato de llave PEM invalido o corrupto: {e}")

    llave_publica: RSA.RsaKey = llave.publickey()

    # Validar tamaño minimo de seguridad (2048 bits)
    if llave_publica.size_in_bits() < 2048:
        raise ValueError(f"La clave es insegura ({llave_publica.size_in_bits()} bits). Se requieren al menos 2048 bits.")

    
    estado_sesion["llave_publica_presidente"] = llave_publica.export_key().decode("utf-8")

    return {
        "status": "exito", 
        "mensaje": "Llave pública del presidente validada y blindada en RAM exitosamente."
    }


def obtener_llave_actual() -> str:
    """
    Otras funciones llamaran a esto para usar la llave sin pedirsela a React.
    """
    if estado_sesion["llave_privada_pem"] is None:
        raise ValueError("Error Fatal: No hay llave privada inyectada en la sesion.")
    return estado_sesion["llave_privada_pem"]


def obtener_rol_actual() -> str:
    """Rol con el que se inyecto la llave ("pintor" o "jurado"), o None si no hay sesion."""
    return estado_sesion["rol"]

def obtener_llave_presidente() -> RSA.RsaKey:
    """
    Otras funciones llamaran a esto para obtener la llave del presidente sin pedirsela a Reactsito
    """
    if estado_sesion["llave_publica_presidente"] is None:
        raise ValueError("Error Fatal: No hay llave publica del presidente inyectada en la sesion.")
    pem_str: str = estado_sesion["llave_publica_presidente"]
    return RSA.import_key(pem_str)



def verificar_boveda(payload=None) -> dict[str, Any]:
    """Indica si hay llave cargada y de qué rol es (para no mezclar pintor/juez/presidente)."""
    return {
        "lista": estado_sesion["llave_privada_pem"] is not None,
        "rol": estado_sesion["rol"],
    }

def cerrar_sesion(payload: Any = None) -> dict[str, bool]:
    """Borra de la RAM del worker la llave privada, el rol, la llave del presidente y las llaves AES."""
    limpiar_llaves_sesion()
    estado_sesion["llave_privada_pem"] = None
    estado_sesion["rol"] = None
    estado_sesion["llave_publica_presidente"] = None
    return {"cerrada": True}