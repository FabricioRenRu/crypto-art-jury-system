"""
/repositories/pintores_repository.py
Funciones para realizar consultas en la tabla pintores de la db
"""

from sqlalchemy.orm import Session
from app.models.pintor import Pintor
from app.schemas.pintor_schemas import PintorCreate
from typing import Optional
import uuid

def exists_by_email(db: Session, email: str) -> bool:
    pintor = db.query(Pintor).filter(Pintor.email == email).first()
    return pintor is not None


def find_by_email(db: Session, email: str) -> Optional[Pintor]:
    return db.query(Pintor).filter(Pintor.email == email).first()

def exists_by_seudonimo(db: Session, seudonimo: str) -> bool:
    return db.query(Pintor).filter(Pintor.seudonimo == seudonimo).first() is not None


def find_by_id(db: Session, id_pintor: uuid.UUID) -> Optional[Pintor]:
    return db.query(Pintor).filter(Pintor.id == id_pintor).first()


def save(
    db: Session,
    payload: PintorCreate,
    ruta_foto: Optional[str],
    clave_publica_ecdsa: str
) -> Pintor:
    db_pintor = Pintor(
        nombre=payload.nombre,
        seudonimo=payload.seudonimo,
        email=payload.email,
        contrasena=payload.contrasena,
        clave_publica_ecdsa=clave_publica_ecdsa,
        foto_perfil=ruta_foto
    )

    db.add(db_pintor)
    db.commit()
    db.refresh(db_pintor)

    return db_pintor