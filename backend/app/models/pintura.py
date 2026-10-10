from app.models.base import Base
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import ForeignKey, func, String, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import List
class Pintura(Base):
    """
    Clase que representa la tabla pintura
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), 
        unique=True
    )

    ruta_pintura_cifrada: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    
    documento_consentimiento: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )
    
    firma_consentimiento: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )

    # relacion 1:1 con Pintor
    pintor: Mapped["Pintor"]  = relationship(
        "Pintor", 
        back_populates="pintura"
    )

    # relacion 1:N con SobreLLave
    sobres: Mapped[List["SobreLlave"]] = relationship(
        "SobreLlave", 
        back_populates="pintura"
    )

    # relacion 1:N con evaluacion
    evaluaciones: Mapped[List["Evaluacion"]] = relationship(
        "Evaluacion", 
        back_populates="pintura"
    )

