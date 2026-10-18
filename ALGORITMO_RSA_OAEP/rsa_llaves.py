import json
import math
import secrets

EXPONENTE_PUBLICO = 65537
BITS_LLAVE = 2048
BITS_MINIMOS_LLAVE = 2048
MARGEN_DIFERENCIA_PRIMOS = 100
RONDAS_MILLER_RABIN = 40
LIMITE_PRIMOS_PEQUENOS = 2000


def generar_primos_pequenos(limite):
    # Criba de Eratostenes para descartar rapido candidatos compuestos
    es_primo = [True] * (limite + 1)
    es_primo[0] = False
    es_primo[1] = False
    numero = 2
    while numero * numero <= limite:
        if es_primo[numero]:
            for multiplo in range(numero * numero, limite + 1, numero):
                es_primo[multiplo] = False
        numero += 1

    primos = []
    for candidato in range(2, limite + 1):
        if es_primo[candidato]:
            primos.append(candidato)
    return primos


PRIMOS_PEQUENOS = generar_primos_pequenos(LIMITE_PRIMOS_PEQUENOS)


def es_probable_primo(candidato, rondas=RONDAS_MILLER_RABIN):
    if candidato < 2:
        return False

    for primo in PRIMOS_PEQUENOS:
        if candidato == primo:
            return True
        if candidato % primo == 0:
            return False

    # Escribir candidato - 1 = 2^exponente_dos * impar
    impar = candidato - 1
    exponente_dos = 0
    while impar % 2 == 0:
        impar //= 2
        exponente_dos += 1

    for _ in range(rondas):
        testigo = secrets.randbelow(candidato - 3) + 2
        valor = pow(testigo, impar, candidato)
        if valor == 1 or valor == candidato - 1:
            continue

        es_compuesto = True
        for _ in range(exponente_dos - 1):
            valor = pow(valor, 2, candidato)
            if valor == candidato - 1:
                es_compuesto = False
                break

        if es_compuesto:
            return False

    return True


def generar_primo(bits):
    while True:
        candidato = secrets.randbits(bits)
        # Encender los dos bits mas altos (p >= 1.5 * 2^(bits-1) > raiz(2) * 2^(bits-1), como pide FIPS 186-5)
        # y el bit bajo (impar). Con esto n tiene exactamente 2*bits
        candidato |= (1 << (bits - 1)) | (1 << (bits - 2)) | 1
        # FIPS 186-5: gcd(e, p - 1) = 1
        if math.gcd(EXPONENTE_PUBLICO, candidato - 1) != 1:
            continue
        if es_probable_primo(candidato):
            return candidato


def euclides_extendido(a, b):
    if b == 0:
        return a, 1, 0
    divisor, x_previo, y_previo = euclides_extendido(b, a % b)
    return divisor, y_previo, x_previo - (a // b) * y_previo


def inverso_modular(valor, modulo):
    divisor, coeficiente, _ = euclides_extendido(valor, modulo)
    if divisor != 1:
        return None
    return coeficiente % modulo


def minimo_comun_multiplo(valor_a, valor_b):
    return valor_a // math.gcd(valor_a, valor_b) * valor_b


def par_consistente(llave_publica, llave_privada):
    # Prueba de consistencia del par: cifrar y descifrar un valor aleatorio con la llave recien generada
    valor_prueba = secrets.randbelow(llave_publica["n"] - 3) + 2
    valor_cifrado = pow(valor_prueba, llave_publica["e"], llave_publica["n"])
    valor_recuperado = pow(valor_cifrado, llave_privada["d"], llave_privada["n"])
    return valor_recuperado == valor_prueba


def generar_par_llaves(bits=BITS_LLAVE):
    if bits < BITS_MINIMOS_LLAVE:
        print(f"La llave debe tener al menos {BITS_MINIMOS_LLAVE} bits")
        return None, None

    mitad_bits = bits // 2
    diferencia_minima = 1 << (mitad_bits - MARGEN_DIFERENCIA_PRIMOS)
    limite_inferior_d = 1 << mitad_bits

    while True:
        primo_p = generar_primo(mitad_bits)
        primo_q = generar_primo(mitad_bits)

        # FIPS 186-5: |p - q| > 2^(nlen/2 - 100) (tambien descarta p == q)
        if abs(primo_p - primo_q) <= diferencia_minima:
            continue

        modulo_n = primo_p * primo_q

        # FIPS 186-5 A.1.1: d = e^-1 mod lambda(n), con lambda(n) = lcm(p - 1, q - 1)
        lambda_n = minimo_comun_multiplo(primo_p - 1, primo_q - 1)
        exponente_privado = inverso_modular(EXPONENTE_PUBLICO, lambda_n)
        if exponente_privado is None:
            continue

        # FIPS 186-5 A.1.1: d > 2^(nlen/2)
        if exponente_privado <= limite_inferior_d:
            continue

        llave_publica = {
            "n": modulo_n,
            "e": EXPONENTE_PUBLICO,
        }
        llave_privada = {
            "n": modulo_n,
            "e": EXPONENTE_PUBLICO,
            "d": exponente_privado,
            "p": primo_p,
            "q": primo_q,
        }

        if not par_consistente(llave_publica, llave_privada):
            continue

        return llave_publica, llave_privada


def guardar_llave(llave, ruta_archivo):
    # Se guardan en hexadecimal para que el frontend (JavaScript) pueda leerlos sin perder precision
    llave_hex = {}
    for nombre, valor in llave.items():
        llave_hex[nombre] = format(valor, "x")

    with open(ruta_archivo, "w") as archivo:
        json.dump(llave_hex, archivo, indent=4)


def cargar_llave(ruta_archivo):
    try:
        with open(ruta_archivo, "r") as archivo:
            llave_hex = json.load(archivo)
    except OSError:
        print(f"No se pudo abrir el archivo de llave: {ruta_archivo}")
        return None

    llave = {}
    for nombre, valor in llave_hex.items():
        llave[nombre] = int(valor, 16)
    return llave
