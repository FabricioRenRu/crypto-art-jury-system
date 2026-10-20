from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

# 1. Generar la clave privada ECDSA (usando la curva SECP256R1 / SECP256k1 segun prefieras)
private_key = ec.generate_private_key(ec.SECP256R1())

# 2. Exportar la clave privada a texto en formato PEM (sin contraseña/encriptación)
private_pem_bytes = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)
private_pem_text = private_pem_bytes.decode('utf-8')

# 3. Obtener y exportar la clave pública a texto en formato PEM
public_key = private_key.public_key()
public_pem_bytes = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)
public_pem_text = public_pem_bytes.decode('utf-8')

# 4. Guardar los textos en archivos .pem
with open("clave_privada.pem", "w") as f:
    f.write(private_pem_text)

with open("clave_publica.pem", "w") as f:
    f.write(public_pem_text)

# Imprimir en consola para verificar el contenido del texto PEM
print("=== CLAVE PRIVADA (PEM) ===")
print(private_pem_text)

print("=== CLAVE PÚBLICA (PEM) ===")
print(public_pem_text)