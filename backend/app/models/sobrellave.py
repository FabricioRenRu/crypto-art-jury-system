from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import Integer, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import Base

class SobreLlave(Base):
    __tablename__ = "sobres_llave"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )
    id_pintura: Mapped[uuid.UUID] = mapped_column(Integer, ForeignKey("pinturas.id"))
    id_jurado: Mapped[uuid.UUID] = mapped_column(Integer, ForeignKey("jurados.id"))
    
    # La llave AES cifrada con el RSA del juez
    llave_aes_cifrada: Mapped[str] = mapped_column(Text, nullable=False)

    # Relaciones
    # relacion N:1 con sobres
    pintura: Mapped["Pintura"] = relationship("Pintura", back_populates="sobres")

    # relacion N:1 con jurado
    juez: Mapped["Jurado"] = relationship("Jurado", back_populates="sobres")