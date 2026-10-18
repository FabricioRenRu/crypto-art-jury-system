# /api/dependencies/auth_deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.utils.security import SECRET_KEY, ALGORITHM

# OAuth2PasswordBearer extrae automáticamente el token del header 'Authorization: Bearer <token>'
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/pintores/login")

async def get_current_token_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """Decodifica el token y valida su integridad matemática."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- GUARDIANES ESPECÍFICOS ---

async def require_pintor(payload: dict = Depends(get_current_token_payload)):
    if payload.get("tipo_actor") != "PINTOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado. Se requiere cuenta de Pintor.")
    return payload

async def require_juez(payload: dict = Depends(get_current_token_payload)):
    if payload.get("tipo_actor") != "JURADO" or payload.get("rol_especifico") != "JUEZ":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado. Rol de Juez requerido.")
    return payload

async def require_presidente(payload: dict = Depends(get_current_token_payload)):
    if payload.get("tipo_actor") != "JURADO" or payload.get("rol_especifico") != "PRESIDENTE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado. Privilegios de Presidente requeridos.")
    return payload