"""
/app/schemas/resultados_schemas.py
Tablero público (paso 10): todo lo necesario para verificar sin confiar en el servidor.
"""
import uuid
from typing import List

from pydantic import BaseModel


class EvaluacionPublica(BaseModel):
    id_evaluacion: uuid.UUID
    id_juez: uuid.UUID
    juez: str
    clave_publica_juez: str
    estrellas: int
    comentario: str
    texto_canonico: str     # lo que se hasheó y firmó, para auditarlo a mano
    hash_original: str      # h = FDH-SHA256(texto_canonico)
    firma_descegada: str    # s del presidente: s^e mod n == h
    firma_juez: str         # RSA-PSS del juez sobre texto_canonico (base64)


class ObraPublica(BaseModel):
    id_pintura: uuid.UUID
    codigo_anonimo: str
    titulo: str
    seudonimo: str
    total_estrellas: int
    posicion: int
    evaluaciones: List[EvaluacionPublica]


class TableroPublicoResponse(BaseModel):
    llave_publica_presidente: str
    obras: List[ObraPublica]