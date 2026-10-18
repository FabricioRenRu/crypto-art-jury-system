"""
/public.python/rsa_utils.py
Funcion de prueba para verificar que el worker jale
"""

from Crypto.PublicKey import RSA

def generar_rsa(payload):
    # Genera la llave privada (toma menos de 1 segundo)
    llave = RSA.generate(2048)
    
    # Exportamos ambas en formato PEM (el estándar para guardar llaves)
    privada_pem = llave.export_key().decode('utf-8')
    publica_pem = llave.publickey().export_key().decode('utf-8')
    
    return {
        "privada": privada_pem,
        "publica": publica_pem
    }