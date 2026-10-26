from pydantic import BaseModel
import uuid


class LlavePublicaJuezResponse(BaseModel):
    """Llave publica RSA de un juez. Solo datos publicos: la privada nunca sale de su .pem."""
    id: uuid.UUID
    nombre: str
    clave_publica_rsa: str
    bits: int


class LlavesPublicasJuradoResponse(BaseModel):
    jueces: list[LlavePublicaJuezResponse]


class PinturaCifradaJuezResponse(BaseModel):
    """Lo que necesita un juez para abrir una obra en su navegador."""
    id_pintura: uuid.UUID
    titulo: str
    descripcion: str
    tipo_mime: str
    # nonce(12) || ciphertext || tag(16), en base64
    pintura_cifrada: str
    hash_pintura_cifrada: str
    # CK = RSA-OAEP(PK_juez, K_AES), en base64. Solo se abre con la privada de este juez
    sobre_llave: str
