"""
public/python/session_utils.py
"""
from typing import TypedDict, Any

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
    payload: PayloadLlave = payload_js.to_py()
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