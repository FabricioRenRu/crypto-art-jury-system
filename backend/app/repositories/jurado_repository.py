from sqlalchemy.orm import Session
from app.models.jurado import Jurado
from typing import Optional

def find_by_email(db: Session, email: str) -> Optional[Jurado]:
    return db.query(Jurado).filter(Jurado.email == email).first()