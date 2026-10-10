import uuid
from app.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func, String, DateTime, Text
from datetime import datetime
from typing import Optional

class Pintor(Base):
    """
    Clase que representa la tabla pintores.
    """
    __tablename__ = "pintores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )

    nombre: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    contrasena: Mapped[str] = mapped_column(
        String(256),
        nullable=False
    )

    # Guardamos la llave publica en formato .PEM (texto)
    clave_publica_firma: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )

    # relacion 1:1 con pintura
    pintura: Mapped[Optional["Pintura"]] = relationship(back_populates="pintor")


