from pydantic import BaseModel, Field, EmailStr, field_validator
import re
import uuid
from typing import Optional


class PintorCreate(BaseModel):
    nombre: str = Field(
        min_length=4,
        max_length=30
    ) 

    seudonimo: str = Field(min_length=3, max_length=50)

    email: EmailStr

    contrasena: str = Field(
        min_length=8,
        max_length=50
    )

    clave_publica_ecdsa: str = Field(
        description="Llave publica del pintor en formato PEM"
    )

    foto_perfil_b64: Optional[str] = None

    @field_validator("contrasena")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "La contrasena debe contener almenos una letra Mayuscula"
            )
        
        if not re.search(r"[0-9]", value):
            raise ValueError(
                "La contrasena debe contener almenos un numero"
            )
        
        return value


    @field_validator("clave_publica_ecdsa")
    @classmethod
    def validate_pem_format(cls, value: str) -> str:
        # 1. Limpiamos espacios o saltos de línea accidentales al inicio/final
        value_limpio: str = value.strip()
        
        # 2. Validamos la cabecera estandar de una llave pública PEM
        if not value_limpio.startswith("-----BEGIN PUBLIC KEY-----"):
            raise ValueError(
                "La llave pública tiene un formato inválido. Debe comenzar con '-----BEGIN PUBLIC KEY-----'."
            )
            
        # 3. Validamos el pie estándar
        if not value_limpio.endswith("-----END PUBLIC KEY-----"):
            raise ValueError(
                "La llave pública tiene un formato inválido. Debe terminar con '-----END PUBLIC KEY-----'."
            )
            
        # 4. Validamos que haya contenido (Base64) entre la cabecera y el pie
        # Dividimos por saltos de línea. Una llave real tendrá al menos 3 lineas
        lineas: list[str] = value_limpio.splitlines()
        if len(lineas) < 3:
            raise ValueError(
                "La llave pública está vacía o corrupta. Faltan los datos en Base64."
            )
            
        return value_limpio

   


class PintorResponse(BaseModel):
    id: uuid.UUID
    email: str
    clave_publica_ecdsa: str

    class Config:
        from_attributes = True
    


