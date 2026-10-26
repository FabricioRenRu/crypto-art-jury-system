from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
import re
import uuid
from typing import Optional
from Crypto.PublicKey import ECC


class PintorCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

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

    clave_publica_ecdsa: str = Field(min_length=50, max_length=4000)
    foto_perfil_b64: Optional[str] = None

    @field_validator("clave_publica_ecdsa")
    @classmethod
    def validate_public_key(cls, value: str) -> str:
        try:
            key = ECC.import_key(value)
        except (ValueError, IndexError, TypeError) as exc:
            raise ValueError("La clave debe ser una llave pública ECDSA P-256 válida.") from exc

        if key.has_private() or key.curve not in ("NIST P-256", "P-256", "secp256r1"):
            raise ValueError("Se requiere únicamente la llave pública ECDSA de curva P-256.")
        return key.public_key().export_key(format="PEM")

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
    tipo_mime: str
    hash_pintura_cifrada: str
    firma_consentimiento: str


class MisObrasResponse(BaseModel):
    total_slots: int
    obras: list[PinturaResponse]
