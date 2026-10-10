from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, Text, ForeignKey
from app.models.base import Base
from enum import Enum

class EstadoEvaluacion(str, Enum):
    ESPERANDO_FIRMA = "ESPERANDO_FIRMA"
    FIRMADO = "FIRMADO"
    PUBLICADO = "PUBLICADO"


class Evaluacion(Base):
    __tablename__ = "evaluaciones"

    id_evaluacion: Mapped[int] = mapped_column(
        Integer, 
        primary_key=True, 
        index=True
    )

    id_pintura: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("pinturas.id_pintura")
    )

    id_jurado: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("jurados.id_jurado")
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