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


def find_sobre(db: Session, id_pintura: uuid.UUID, id_jurado: uuid.UUID) -> Optional[SobreLlave]:
    return (
        db.query(SobreLlave)
        .filter(SobreLlave.id_pintura == id_pintura, SobreLlave.id_jurado == id_jurado)
        .first()
    )


def find_by_juez(db: Session, id_jurado: uuid.UUID) -> list[Pintura]:
    """Pinturas que tienen un sobre de llave para este juez (las que le toca evaluar)."""
    return (
        db.query(Pintura)
        .join(SobreLlave, SobreLlave.id_pintura == Pintura.id)
        .options(selectinload(Pintura.evaluaciones))
        .filter(SobreLlave.id_jurado == id_jurado)
        .order_by(Pintura.creado_en)
        .all()
    )


def save_con_sobres(db: Session, pintura: Pintura, sobres: list[SobreLlave]) -> Pintura:
    """Inserta la pintura y todos sus sobres en UNA sola transaccion (todo o nada)."""
    db.add(pintura)
    # Se hace flush antes para que la fila de la pintura exista cuando entren los sobres
    db.flush()
    db.add_all(sobres)
    db.commit()
    db.refresh(pintura)
    return pintura


def save(db: Session, pintura: Pintura) -> Pintura:
    """Inserta una pintura y confirma la transacción."""
    db.add(pintura)
    db.commit()
    db.refresh(pintura)
    return pintura
