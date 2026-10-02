import base64
import os
import time

from rsa_llaves import generar_par_llaves, guardar_llave, cargar_llave
from oaep import cifrar_oaep, descifrar_oaep
from sobre_llave import (
    generar_llave_sesion,
    generar_sobres_jurado,
    desenvolver_llave,
    envolver_llave,
    construir_etiqueta,
)

CARPETA_LLAVES = "llaves"
JUECES = ["juez_1", "juez_2", "juez_3"]
ID_OBRA = 17


def imprimir_resultado(descripcion, paso):
    if paso:
        estado = "CORRECTO"
    else:
        estado = "FALLO"
    print(f"    {descripcion:<55}{estado:>10}")


def preparar_llaves_jurado():
    os.makedirs(CARPETA_LLAVES, exist_ok=True)
    llaves_publicas = {}
    llaves_privadas = {}

    print("Generacion de llaves RSA-2048 del jurado\n")
    print(f"    {'Juez':<12}{'Bits de n':>10}{'Tiempo (s)':>14}")
    for id_juez in JUECES:
        inicio = time.time()
        llave_publica, llave_privada = generar_par_llaves()
        duracion = time.time() - inicio

        guardar_llave(llave_publica, os.path.join(CARPETA_LLAVES, f"{id_juez}_publica.json"))
        guardar_llave(llave_privada, os.path.join(CARPETA_LLAVES, f"{id_juez}_privada.json"))

        # Se recargan desde archivo para probar tambien la serializacion
        llaves_publicas[id_juez] = cargar_llave(os.path.join(CARPETA_LLAVES, f"{id_juez}_publica.json"))
        llaves_privadas[id_juez] = cargar_llave(os.path.join(CARPETA_LLAVES, f"{id_juez}_privada.json"))
        print(f"    {id_juez:<12}{llave_publica['n'].bit_length():>10}{duracion:>14.2f}")

    print()
    return llaves_publicas, llaves_privadas


def probar_flujo_normal(llaves_publicas, llaves_privadas):
    llave_sesion = generar_llave_sesion()
    print(f"Llave de sesion K_AES (obra {ID_OBRA})\n")
    print(f"    {'K_AES':<12}{llave_sesion.hex()}\n")

    sobres = generar_sobres_jurado(llave_sesion, llaves_publicas, ID_OBRA)

    print("Sobres de llave generados (CK = RSA-OAEP(PK_juez, K_AES))\n")
    print(f"    {'Juez':<12}{'Bytes':>8}   {'Inicio del sobre (base64)'}")
    for id_juez, sobre in sobres.items():
        tamano = len(base64.b64decode(sobre))
        print(f"    {id_juez:<12}{tamano:>8}   {sobre[:40]}...")
    print()

    print("Recuperacion de K_AES por cada juez\n")
    for id_juez in JUECES:
        llave_recuperada = desenvolver_llave(sobres[id_juez], llaves_privadas[id_juez], ID_OBRA)
        imprimir_resultado(f"{id_juez} recupera la misma K_AES", llave_recuperada == llave_sesion)
    print()

    return llave_sesion, sobres


def probar_ataques(llave_sesion, sobres, llaves_publicas, llaves_privadas):
    print("Pruebas de seguridad\n")

    # Un juez no puede abrir el sobre de otro juez
    resultado = desenvolver_llave(sobres["juez_1"], llaves_privadas["juez_2"], ID_OBRA)
    imprimir_resultado("juez_2 no puede abrir el sobre de juez_1", resultado is None)

    # Cambiar un solo bit del sobre lo invalida
    sobre_bytes = bytearray(base64.b64decode(sobres["juez_1"]))
    sobre_bytes[100] ^= 0x01
    sobre_alterado = base64.b64encode(bytes(sobre_bytes)).decode("ascii")
    resultado = desenvolver_llave(sobre_alterado, llaves_privadas["juez_1"], ID_OBRA)
    imprimir_resultado("Sobre con un bit alterado es rechazado", resultado is None)

    # El sobre de la obra 17 no sirve si el servidor lo asocia a otra obra
    resultado = desenvolver_llave(sobres["juez_1"], llaves_privadas["juez_1"], ID_OBRA + 1)
    imprimir_resultado("Sobre movido a otra obra es rechazado", resultado is None)

    # OAEP es probabilistico: misma llave, sobres distintos
    sobre_a = envolver_llave(llave_sesion, llaves_publicas["juez_1"], ID_OBRA)
    sobre_b = envolver_llave(llave_sesion, llaves_publicas["juez_1"], ID_OBRA)
    imprimir_resultado("Cifrar dos veces la misma K_AES da sobres distintos", sobre_a != sobre_b)

    # Limite de tamano: con RSA-2048 y SHA-256 caben como maximo 190 bytes
    resultado = cifrar_oaep(b"A" * 191, llaves_publicas["juez_1"])
    imprimir_resultado("Mensaje de 191 bytes es rechazado (maximo 190)", resultado is None)
    print()


def probar_compatibilidad(sobres, llaves_privadas):
    # Se compara contra la libreria cryptography para comprobar que seguimos el estandar
    try:
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import padding, rsa
    except ImportError:
        print("Libreria cryptography no instalada, se omite la prueba de compatibilidad")
        return

    print("Compatibilidad con la libreria cryptography (RFC 8017)\n")

    llave_propia = llaves_privadas["juez_1"]
    numeros_publicos = rsa.RSAPublicNumbers(llave_propia["e"], llave_propia["n"])
    numeros_privados = rsa.RSAPrivateNumbers(
        p=llave_propia["p"],
        q=llave_propia["q"],
        d=llave_propia["d"],
        dmp1=llave_propia["d"] % (llave_propia["p"] - 1),
        dmq1=llave_propia["d"] % (llave_propia["q"] - 1),
        iqmp=pow(llave_propia["q"], -1, llave_propia["p"]),
        public_numbers=numeros_publicos,
    )
    llave_libreria = numeros_privados.private_key()

    relleno = padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=construir_etiqueta(ID_OBRA),
    )

    # Nuestro cifrado -> descifrado de la libreria
    llave_propia_descifrada = desenvolver_llave(sobres["juez_1"], llave_propia, ID_OBRA)
    llave_libreria_descifrada = llave_libreria.decrypt(base64.b64decode(sobres["juez_1"]), relleno)
    imprimir_resultado("La libreria abre un sobre creado por nosotros", llave_libreria_descifrada == llave_propia_descifrada)

    # Cifrado de la libreria -> nuestro descifrado
    llave_prueba = generar_llave_sesion()
    sobre_libreria = llave_libreria.public_key().encrypt(llave_prueba, relleno)
    sobre_libreria_base64 = base64.b64encode(sobre_libreria).decode("ascii")
    resultado = desenvolver_llave(sobre_libreria_base64, llave_propia, ID_OBRA)
    imprimir_resultado("Nosotros abrimos un sobre creado por la libreria", resultado == llave_prueba)
    print()


def main():
    llaves_publicas, llaves_privadas = preparar_llaves_jurado()
    llave_sesion, sobres = probar_flujo_normal(llaves_publicas, llaves_privadas)
    probar_ataques(llave_sesion, sobres, llaves_publicas, llaves_privadas)
    probar_compatibilidad(sobres, llaves_privadas)


if __name__ == "__main__":
    main()
