"""
seed_jurados.py
Script para guardar los 3 jueces y el presidente en la base de datos
Este script genera sus respectivas par de llaves RSA y solo se puede ejecutar 1 vez
"""
from app.database.connection import SessionLocal
from app.models.jurado import Jurado, RolJurado
from app.utils.security import get_password_hash
from typing import Any
from sqlalchemy.orm import Session

def seed_jurados():
    db: Session = SessionLocal()
    try:
        # Verificar si ya existen para no duplicarlos
        if db.query(Jurado).count() > 0:
            print("Los jurados ya están registrados en la base de datos.")
            return

        print(" Iniciando el Protocolo de Generación de Jurados...\n")

        perfiles: list[dict[str, Any]] = [
            {"nombre": "Presidente", "email": "presidente@concurso.com", "rol": RolJurado.PRESIDENTE},
            {"nombre": "Juez Uno", "email": "juez1@concurso.com", "rol": RolJurado.JUEZ},
            {"nombre": "Juez Dos", "email": "juez2@concurso.com", "rol": RolJurado.JUEZ},
            {"nombre": "Juez Tres", "email": "juez3@concurso.com", "rol": RolJurado.JUEZ},
        ]

        for perfil in perfiles:
            # Hasheamos una contraseña por defecto (ej. JuezUno123)
            password_plana = f"{perfil['nombre'].replace(' ', '')}123"
            password_hash = get_password_hash(password_plana)

            # Insertamos en SQLAlchemy
            nuevo_jurado = Jurado(
                nombre=perfil['nombre'],
                email=perfil['email'],
                password=password_hash,
                rol=perfil['rol']
            )
            db.add(nuevo_jurado)
            print(f"{perfil['nombre']} insertado en la BD con contraseña: {password_plana}\n")

        db.commit()
        print( "Los 4 miembros del Jurado han sido registrados exitosamente")

    except Exception as e:
        db.rollback()
        print(f" Error durante el seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_jurados()