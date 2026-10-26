from sqlalchemy.orm import Session
from app.models.jurado import Jurado, RolJurado
from typing import Optional

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
