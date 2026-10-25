"""
app/repositories/pinturas_repository.py
Consultas y escrituras de pinturas y sobres de llave.
"""
from typing import Optional
import uuid

from sqlalchemy.orm import Session, selectinload

from app.models.pintura import Pintura
from app.models.sobrellave import SobreLlave


def find_by_pintor(db: Session, id_pintor: uuid.UUID) -> Optional[Pintura]:
    return (
        db.query(Pintura)
        .options(selectinload(Pintura.evaluaciones))
        .filter(Pintura.pintor_id == id_pintor)
        .first()
    )


def find_by_id(db: Session, id_pintura: uuid.UUID) -> Optional[Pintura]:
    return db.query(Pintura).filter(Pintura.id == id_pintura).first()


def save_con_sobres(db: Session, pintura: Pintura, sobres: list[SobreLlave]) -> Pintura:
    """Inserta la pintura y todos sus sobres en UNA sola transaccion (todo o nada)."""
    db.add(pintura)
    db.add_all(sobres)
    db.commit()
    db.refresh(pintura)
    return pintura
