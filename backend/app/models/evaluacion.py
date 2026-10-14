from sqlalchemy.orm import Mapped, mapped_column, relationship, func
from sqlalchemy import Integer, Text, ForeignKey
from app.models.base import Base
from enum import Enum
import uuid
from sqlalchemy.dialects.postgresql import UUID

class EstadoEvaluacion(str, Enum):
    ESPERANDO_FIRMA = "ESPERANDO_FIRMA"
    FIRMADO = "FIRMADO"
    PUBLICADO = "PUBLICADO"


class Evaluacion(Base):
    __tablename__ = "evaluaciones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )

    id_pintura: Mapped[uuid.UUID] = mapped_column(
        Integer, 
        ForeignKey("pinturas.id")
    )

    id_jurado: Mapped[uuid.UUID] = mapped_column(
        Integer, 
        ForeignKey("jurados.id")
    )
    
    estado: Mapped[EstadoEvaluacion] = mapped_column(
        Enum(EstadoEvaluacion, native_enum=False, length=50), 
        default=EstadoEvaluacion.ESPERANDO_FIRMA
    )
    
    # === DATOS CIFRADOS  ===
    hash_cegado: Mapped[str] = mapped_column(
        Text, 
        nullable=True
    )        # h'
    firma_ciega_presi: Mapped[str] = mapped_column(
        Text, 
        nullable=True
    )  # s'
    
    # === DATOS EN TEXTO CLARO  ===
    estrellas: Mapped[int] = mapped_column(
        Integer, 
        nullable=True
    )

    comentarios: Mapped[str] = mapped_column(
        Text, 
        nullable=True
    )
    hash_original: Mapped[str] = mapped_column(
        Text, 
        nullable=True
    )      # h
    firma_del_juez: Mapped[str] = mapped_column(
        Text, 
        nullable=True
    )     # Firma del juez sobre h
    firma_descegada: Mapped[str] = mapped_column(
        Text, 
        nullable=True
    )    # s (Firma final del presidente)

    # Relaciones
    # N: 1 con pintura
    pintura: Mapped["Pintura"] = relationship(
        "Pintura", 
        back_populates="evaluaciones"
    )

    # Relacion N: 1 con jurado 
    juez: Mapped["Jurado"] = relationship(
        "Jurado", 
        back_populates="evaluaciones"
    )