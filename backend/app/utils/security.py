from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
from typing import Optional, Final, Any

SECRET_KEY: Final[str] = "tu_super_secreto_criptografico_de_alta_entropia"  # Despues sacarlo de un .env
ALGORITHM: Final[str] = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: Final[int] = 120

pwd_context: CryptContext = CryptContext(
    schemes=["bcrypt"],  # algoritmos permitidos
    deprecated="auto"
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Hashea plain_password, compara con hashed_password, y devuelve
    true o false dependiendo de si son iguales o no
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hashea y retorna la contrasena recibida
    """

    return pwd_context.hash(password)


def create_access_token(
    subject_id: str, 
    email: str, 
    tipo_actor: str, 
    rol_especifico: str, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Genera un JWT inyectando el rol y el tipo de actor."""
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    to_encode: dict[str, Any] = {
        "sub": str(subject_id),
        "email": email,
        "tipo_actor": tipo_actor,
        "rol_especifico": rol_especifico,
        "exp": expire
    }
    
    encoded_jwt: str = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt