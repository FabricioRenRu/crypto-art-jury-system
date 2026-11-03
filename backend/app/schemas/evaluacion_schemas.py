"""
/app/schemas/evaluacion_schemas.py
"""

from pydantic import BaseModel, Field
import uuid
from typing import List, Annotated, Optional


# Entero RSA en decimal (un número de 2048 bits tiene ~617 dígitos)
NumeroRSA = Annotated[str, Field(pattern=r'^\d+$', max_length=700)]

class HashedEvaluationCreate(BaseModel):
    id_pintura: uuid.UUID
    hash_cegado: NumeroRSA
    # nonce(12) || AES-GCM(evaluación canónica) || tag(16), en base64. Solo el juez la puede abrir
    evaluacion_cifrada: str = Field(..., min_length=40, max_length=12000)

class HashedEvaluationResponse(BaseModel):
    id: uuid.UUID


class HashPendiente(BaseModel):
    id_evaluacion: str
    hash_cegado: str

class FirmaCiegaCreate(BaseModel):
    id_evaluacion: str
    firma_ciega_presi: NumeroRSA


class FirmasMasivasRequest(BaseModel):
    firmas: List[FirmaCiegaCreate] = Field(..., min_length=1)


class MiEvaluacionResponse(BaseModel):
    id_evaluacion: uuid.UUID
    id_pintura: uuid.UUID
    estado: str
    firma_ciega_presi: Optional[str] = None   # s', solo cuando estado == FIRMADO
    evaluacion_cifrada: Optional[str] = None  # se borra al publicar


class MisEvaluacionesResponse(BaseModel):
    evaluaciones: List[MiEvaluacionResponse]


class PublicarEvaluacionRequest(BaseModel):
    id_pintura: uuid.UUID
    estrellas: int = Field(..., ge=1, le=3)
    comentario: str = Field("", max_length=1000)
    firma_descegada: NumeroRSA                                     # s del presidente
    firma_juez: str = Field(..., min_length=100, max_length=1100)  # RSA-PSS del juez, base64
    llave_aes: str = Field(..., min_length=44, max_length=44)  # K_AES de la obra (32 bytes en base64)

class PublicarEvaluacionResponse(BaseModel):
    id_evaluacion: uuid.UUID
    estado: str
