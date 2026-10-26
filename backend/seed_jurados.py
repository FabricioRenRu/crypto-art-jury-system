"""
seed_jurados.py
Script para guardar los 3 jueces y el presidente en la base de datos.
A cada juez le genera su par de llaves RSA-2048: la publica va a la BD (para los sobres
RSA-OAEP) y la privada se exporta a un .pem que se le entrega al juez.
Si los jurados ya existen, solo genera llaves para los jueces que aun no tienen.
"""
from Crypto.PublicKey import RSA
from app.database.connection import SessionLocal
from app.models.jurado import Jurado, RolJurado
from app.utils.security import get_password_hash
from typing import Any
from sqlalchemy.orm import Session

BITS_LLAVE_RSA = 2048


def generar_llaves_rsa() -> tuple[str, str]:
    """Genera un par de llaves RSA de 2048 bits en PEM."""
    llave: RSA.RsaKey = RSA.generate(BITS_LLAVE_RSA)
    privada_pem: str = llave.export_key().decode('utf-8')
    publica_pem: str = llave.publickey().export_key().decode('utf-8')
    return privada_pem, publica_pem


def guardar_llave_privada(nombre: str, llave_privada: str):
    """Guarda la llave privada en un archivo .pem en tu disco duro."""
    filename: str = f"llave_privada_{nombre.lower().replace(' ', '_')}.pem"
    with open(filename, "w") as f:
        f.write(llave_privada)
    print(f"Llave privada exportada a: {filename}")


def asignar_llaves_rsa(jurado: Jurado):
    privada, publica = generar_llaves_rsa()
    guardar_llave_privada(jurado.nombre, privada)
    jurado.clave_publica_rsa = publica


def completar_llaves_jueces(db: Session):
    """Para una BD ya creada sin llaves RSA (version anterior de este script)."""
    jueces_sin_llave = (
        db.query(Jurado)
        .filter(Jurado.rol == RolJurado.JUEZ, Jurado.clave_publica_rsa.is_(None))
        .all()
    )
    if len(jueces_sin_llave) == 0:
        print("Los jurados ya están registrados y todos los jueces tienen llave RSA.")
        return

    for juez in jueces_sin_llave:
        print(f"Generando llaves RSA para {juez.nombre}")
        asignar_llaves_rsa(juez)
    db.commit()
    print(f"Se generaron llaves RSA para {len(jueces_sin_llave)} jueces")


def seed_jurados():
    db: Session = SessionLocal()
    try:
        # Verificar si ya existen para no duplicarlos
        if db.query(Jurado).count() > 0:
            completar_llaves_jueces(db)
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

            # Solo los jueces reciben sobres; el presidente firma a ciegas
            if perfil['rol'] == RolJurado.JUEZ:
                print(f"Generando llaves RSA para {perfil['nombre']}")
                asignar_llaves_rsa(nuevo_jurado)

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
