from sqlalchemy.orm import Session
from app.models.jurado import Jurado, RolJurado
from typing import Optional
import uuid

def find_by_id(db: Session, id_jurado: uuid.UUID) -> Optional[Jurado]:
    return db.query(Jurado).filter(Jurado.id == id_jurado).first()

def find_by_email(db: Session, email: str) -> Optional[Jurado]:
    return db.query(Jurado).filter(Jurado.email == email).first()


def find_jueces(db: Session) -> list[Jurado]:
    """Devuelve los jueces, excluyendo al presidente."""
    return (
        db.query(Jurado)
        .filter(Jurado.rol == RolJurado.JUEZ)
        .order_by(Jurado.email)
        .all()
    )


def find_presidentes(db: Session) -> list[Jurado]:
    """Devuelve al presidente (deberia ser solo uno)"""
    return (
        db.query(Jurado)
        .filter(Jurado.rol == RolJurado.PRESIDENTE)
        .order_by(Jurado.email)
        .all()
    )
