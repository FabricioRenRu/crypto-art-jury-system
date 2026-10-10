from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, Text
from enum import Enum
from app.models.base import Base

class RolJurado(str, Enum):
    JUEZ = "JUEZ"
    PRESIDENTE = "PRESIDENTE"


class Jurado(Base):
    __tablename__ = "jurados"

    id_jurado: Mapped[int] = mapped_column(
        Integer, 
        primary_key=True, 
        index=True
    )
    nombre: Mapped[str] = mapped_column(
        String(100), 
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(100),
        unique=True
    )

    password: Mapped[str] = mapped_column(
        String(256),
        nullable=False
    )
    
    rol: Mapped[RolJurado] = mapped_column(Enum(RolJurado), nullable=False)
    clave_publica_rsa: Mapped[str] = mapped_column(Text, nullable=False) # Para cifrarle los sobres

    # Relaciones 1:N
    sobres = relationship("SobreLlave", back_populates="juez")
    evaluaciones = relationship("Evaluacion", back_populates="juez")