from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, func, Enum as SQLEnum
from enum import Enum
from app.models.base import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import List
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.evaluacion import Evaluacion


class RolJurado(str, Enum):
    JUEZ = "JUEZ"
    PRESIDENTE = "PRESIDENTE"


class Jurado(Base):
    __tablename__ = "jurados"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
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
    
    rol: Mapped[RolJurado] = mapped_column(SQLEnum(RolJurado), nullable=False)
    # Relaciones
    evaluaciones: Mapped[List["Evaluacion"]] = relationship("Evaluacion", back_populates="juez")