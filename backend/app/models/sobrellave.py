from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import Integer, ForeignKey, Text
from app.models.base import Base

class SobreLlave(Base):
    __tablename__ = "sobres_llave"

    id_sobre: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    id_pintura: Mapped[int] = mapped_column(Integer, ForeignKey("pinturas.id_pintura"))
    id_jurado: Mapped[int] = mapped_column(Integer, ForeignKey("jurados.id_jurado"))
    
    # La llave AES cifrada con el RSA del juez
    llave_aes_cifrada: Mapped[str] = mapped_column(Text, nullable=False)

    # Relaciones
    # relacion N:1 con sobres
    pintura: Mapped["Pintura"] = relationship("Pintura", back_populates="sobres")

    # relacion N:1 con jurado
    juez: Mapped["Jurado"] = relationship("Jurado", back_populates="sobres")