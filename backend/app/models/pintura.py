from app.models.base import Base
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import ForeignKey, func, String, Text, DateTime
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import List
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.pintor import Pintor
    from app.models.sobrellave import SobreLlave
    from app.models.evaluacion import Evaluacion


class Pintura(Base):
    """
    Clase que representa la tabla pintura
    """
    __tablename__ = "pinturas"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid()
    )

    pintor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pintores.id"), 
        unique=True
    )

    titulo: Mapped[str] = mapped_column(String(120), nullable=False)

    descripcion: Mapped[str] = mapped_column(Text, nullable=False)

    # Ruta (relativa a STORAGE_DIR) del archivo nonce(12) || ciphertext || tag(16)
    ruta_pintura_cifrada: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )

    # Tipo MIME detectado por el servidor al subir (para devolverle la imagen al dueno)
    mime_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # SHA-256 (hex) del archivo cifrado; va dentro del consentimiento firmado
    hash_pintura_cifrada: Mapped[str] = mapped_column(String(64), nullable=False)

    # K_AES cifrada con una llave derivada de la privada ECDSA del pintor (para que
    # solo el pueda volver a ver su obra). Nunca se guarda K_AES en claro.
    llave_aes_pintor_cifrada: Mapped[str] = mapped_column(Text, nullable=False)

    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    # JSON canonico que el pintor firma con su llave privada ECDSA
    documento_consentimiento: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )
    
    # Firma ECDSA (hex, r||s) sobre documento_consentimiento
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

