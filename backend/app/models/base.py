
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Clase base, todos los modelos heredan de esta clase para que SQLAlchemy los reconozca
    """
    pass