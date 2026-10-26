"""
app/repositories/pinturas_repository.py
Consultas y escrituras de pinturas.
"""
from typing import Optional
import uuid

from sqlalchemy.orm import Session, selectinload

from app.models.pintura import Pintura


def find_by_pintor(db: Session, id_pintor: uuid.UUID) -> Optional[Pintura]:
    return (
        db.query(Pintura)
        .options(selectinload(Pintura.evaluaciones))
        .filter(Pintura.pintor_id == id_pintor)
        .first()
    )


def find_by_id(db: Session, id_pintura: uuid.UUID) -> Optional[Pintura]:
    return db.query(Pintura).filter(Pintura.id == id_pintura).first()


def save(db: Session, pintura: Pintura) -> Pintura:
    """Inserta una pintura y confirma la transacción."""
    db.add(pintura)
    db.commit()
    db.refresh(pintura)
    return pintura
