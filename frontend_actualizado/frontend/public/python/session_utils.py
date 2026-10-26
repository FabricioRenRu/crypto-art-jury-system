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


estado_sesion: dict[str, str] = {
    "llave_privada_pem": None,
    "rol": None
}


def inyectar_llave_privada(payload_js: Any) -> dict[str, str]:
    """
    Guarda la llave en la variable global y confirma exito
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
    estado_sesion["llave_privada_pem"] = payload["pem"]
    estado_sesion["rol"] = payload["rol"]
    
    # Retornamos un mensaje para que React sepa que ya puede avanzar
    return {
        "status": "exito", 
        "mensaje": "Llave blindada en RAM exitosamente."
    }

def obtener_llave_actual() -> str:
    """
    Otras funciones llamaran a esto para usar la llave sin pedirsela a React.
    """
    if estado_sesion["llave_privada_pem"] is None:
        raise ValueError("Error Fatal: No hay llave privada inyectada en la sesion.")
    return estado_sesion["llave_privada_pem"]


def verificar_boveda(payload=None) -> bool:
    """Devuelve True si hay una llave cargada, False si hay amnesia."""
    return {"lista": estado_sesion["llave_privada_pem"] is not None}