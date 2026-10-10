"""
Modulo para realizar la conexion y gestionar las sesiones a la base de datos
"""
from typing import Final, Generator
import os
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()


DB_USER : Final[str] = os.getenv("DB_USER")
DB_PASSWORD: Final[str] = os.getenv("DB_PASSWORD")
DB_HOST: Final[str] = os.getenv("DB_HOST")
DB_PORT: Final[str] = os.getenv("DB_PORT")
DB_NAME: Final[str] = os.getenv("DB_NAME")

if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
    raise ValueError("Faltan variables de entorno necesarias para la conexion a la Base de Datos.")

SQLALCHEMY_DATABASE_URL: Final[str] = (
    f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Crear conexion entre API y db
engine: Engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Crear fabrica de sesiones para hacer consultas
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """
    Crea y cierra una sesion a la base de datos por peticion
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()