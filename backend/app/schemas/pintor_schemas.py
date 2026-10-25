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


class PintorResponse(BaseModel):
    id: uuid.UUID
    email: str
    clave_publica_ecdsa: str

    class Config:
        from_attributes = True


class PintorRegistroResponse(PintorResponse):
    """
    Respuesta del registro. Incluye la llave privada UNA sola vez para que el usuario la
    descargue; el servidor no la guarda.
    """
    clave_privada_pem: str


class CargarLlaveRequest(BaseModel):
    pem: str = Field(min_length=50, max_length=4000)


class EstadoLlaveResponse(BaseModel):
    lista: bool


class PerfilPintorResponse(BaseModel):
    """Datos del encabezado del Panel del Pintor."""
    nombre: str
    seudonimo: str
    torneo: str
    foto_perfil: Optional[str] = None


class PinturaResponse(BaseModel):
    """Una obra del pintor (tarjeta del Panel del Pintor)."""
    id: uuid.UUID
    slot: int
    total_slots: int
    titulo: str
    descripcion: str
    estado: str
    hash_pintura_cifrada: str
    firma_consentimiento: str


class MisObrasResponse(BaseModel):
    total_slots: int
    obras: list[PinturaResponse]
