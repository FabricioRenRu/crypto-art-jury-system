import hashlib
import hmac
import secrets

LONGITUD_HASH = 32  # Bytes de salida de SHA-256


def entero_a_bytes(numero, longitud):
    # I2OSP del RFC 8017
    return numero.to_bytes(longitud, "big")


def bytes_a_entero(datos):
    # OS2IP del RFC 8017
    return int.from_bytes(datos, "big")


def sha256(datos):
    return hashlib.sha256(datos).digest()


def xor_bytes(datos_a, datos_b):
    resultado = bytearray(len(datos_a))
    for indice in range(len(datos_a)):
        resultado[indice] = datos_a[indice] ^ datos_b[indice]
    return bytes(resultado)


def mgf1(semilla, longitud_mascara):
    # Funcion generadora de mascara: concatena SHA-256(semilla || contador) hasta cubrir la longitud
    mascara = b""
    contador = 0
    while len(mascara) < longitud_mascara:
        mascara += sha256(semilla + entero_a_bytes(contador, 4))
        contador += 1
    return mascara[:longitud_mascara]


def longitud_modulo(llave):
    return (llave["n"].bit_length() + 7) // 8


def codificar_oaep(mensaje, longitud_bloque, etiqueta=b""):
    max_longitud_mensaje = longitud_bloque - 2 * LONGITUD_HASH - 2
    if len(mensaje) > max_longitud_mensaje:
        return None

    # DB = lHash || PS || 0x01 || M
    hash_etiqueta = sha256(etiqueta)
    relleno_ceros = b"\x00" * (max_longitud_mensaje - len(mensaje))
    bloque_datos = hash_etiqueta + relleno_ceros + b"\x01" + mensaje

    # La semilla aleatoria hace que cifrar dos veces lo mismo produzca resultados distintos
    semilla = secrets.token_bytes(LONGITUD_HASH)

    mascara_datos = mgf1(semilla, longitud_bloque - LONGITUD_HASH - 1)
    bloque_datos_enmascarado = xor_bytes(bloque_datos, mascara_datos)

    mascara_semilla = mgf1(bloque_datos_enmascarado, LONGITUD_HASH)
    semilla_enmascarada = xor_bytes(semilla, mascara_semilla)

    # EM = 0x00 || maskedSeed || maskedDB
    return b"\x00" + semilla_enmascarada + bloque_datos_enmascarado


def decodificar_oaep(bloque_codificado, longitud_bloque, etiqueta=b""):
    byte_inicial = bloque_codificado[0]
    semilla_enmascarada = bloque_codificado[1:1 + LONGITUD_HASH]
    bloque_datos_enmascarado = bloque_codificado[1 + LONGITUD_HASH:]

    mascara_semilla = mgf1(bloque_datos_enmascarado, LONGITUD_HASH)
    semilla = xor_bytes(semilla_enmascarada, mascara_semilla)

    mascara_datos = mgf1(semilla, longitud_bloque - LONGITUD_HASH - 1)
    bloque_datos = xor_bytes(bloque_datos_enmascarado, mascara_datos)

    hash_etiqueta_recibido = bloque_datos[:LONGITUD_HASH]
    resto = bloque_datos[LONGITUD_HASH:]

    # Buscar el separador 0x01 recorriendo todo el bloque (sin salir antes)
    indice_separador = -1
    relleno_valido = True
    for indice in range(len(resto)):
        if indice_separador == -1:
            if resto[indice] == 1:
                indice_separador = indice
            elif resto[indice] != 0:
                relleno_valido = False

    etiqueta_valida = hmac.compare_digest(hash_etiqueta_recibido, sha256(etiqueta))

    # Un solo error generico: no revelar cual verificacion fallo (ataque de Manger)
    if byte_inicial != 0 or not etiqueta_valida or not relleno_valido or indice_separador == -1:
        return None

    return resto[indice_separador + 1:]


def cifrar_oaep(mensaje, llave_publica, etiqueta=b""):
    longitud_bloque = longitud_modulo(llave_publica)

    bloque_codificado = codificar_oaep(mensaje, longitud_bloque, etiqueta)
    if bloque_codificado is None:
        return None

    # c = m^e mod n
    entero_mensaje = bytes_a_entero(bloque_codificado)
    entero_cifrado = pow(entero_mensaje, llave_publica["e"], llave_publica["n"])
    return entero_a_bytes(entero_cifrado, longitud_bloque)


def descifrar_oaep(cifrado, llave_privada, etiqueta=b""):
    longitud_bloque = longitud_modulo(llave_privada)
    if len(cifrado) != longitud_bloque:
        return None

    entero_cifrado = bytes_a_entero(cifrado)
    if entero_cifrado >= llave_privada["n"]:
        return None

    # m = c^d mod n
    entero_mensaje = pow(entero_cifrado, llave_privada["d"], llave_privada["n"])
    bloque_codificado = entero_a_bytes(entero_mensaje, longitud_bloque)
    return decodificar_oaep(bloque_codificado, longitud_bloque, etiqueta)
