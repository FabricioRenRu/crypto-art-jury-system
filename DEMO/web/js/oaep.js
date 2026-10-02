const LONGITUD_HASH = 32;  // Bytes de salida de SHA-256

export function hex_a_bytes(texto_hex)
{
    if (texto_hex.length % 2 !== 0)
    {
        texto_hex = "0" + texto_hex;
    }

    const bytes = new Uint8Array(texto_hex.length / 2);
    for (let indice = 0; indice < bytes.length; indice++)
    {
        bytes[indice] = parseInt(texto_hex.substr(indice * 2, 2), 16);
    }
    return bytes;
}

export function bytes_a_hex(bytes)
{
    let texto_hex = "";
    for (let indice = 0; indice < bytes.length; indice++)
    {
        texto_hex += bytes[indice].toString(16).padStart(2, "0");
    }
    return texto_hex;
}

export function bytes_a_entero(bytes)
{
    // OS2IP del RFC 8017
    if (bytes.length === 0)
    {
        return 0n;
    }
    return BigInt("0x" + bytes_a_hex(bytes));
}

export function entero_a_bytes(numero, longitud)
{
    // I2OSP del RFC 8017
    const texto_hex = numero.toString(16);
    if (texto_hex.length > longitud * 2)
    {
        return null;
    }
    return hex_a_bytes(texto_hex.padStart(longitud * 2, "0"));
}

export function potencia_modular(base, exponente, modulo)
{
    // Exponenciacion binaria (elevar al cuadrado y multiplicar)
    let resultado = 1n;
    base = base % modulo;
    while (exponente > 0n)
    {
        if (exponente & 1n)
        {
            resultado = (resultado * base) % modulo;
        }
        exponente = exponente >> 1n;
        base = (base * base) % modulo;
    }
    return resultado;
}

export function longitud_modulo(llave)
{
    return Math.ceil(llave.n.toString(2).length / 8);
}

export function concatenar_bytes(lista_partes)
{
    let longitud_total = 0;
    for (const parte of lista_partes)
    {
        longitud_total += parte.length;
    }

    const resultado = new Uint8Array(longitud_total);
    let posicion = 0;
    for (const parte of lista_partes)
    {
        resultado.set(parte, posicion);
        posicion += parte.length;
    }
    return resultado;
}

async function sha256(datos)
{
    return new Uint8Array(await crypto.subtle.digest("SHA-256", datos));
}

function xor_bytes(datos_a, datos_b)
{
    const resultado = new Uint8Array(datos_a.length);
    for (let indice = 0; indice < datos_a.length; indice++)
    {
        resultado[indice] = datos_a[indice] ^ datos_b[indice];
    }
    return resultado;
}

function son_iguales(datos_a, datos_b)
{
    // Comparacion sin salir antes para no filtrar en que byte difieren
    let diferencia = datos_a.length ^ datos_b.length;
    const longitud = Math.min(datos_a.length, datos_b.length);
    for (let indice = 0; indice < longitud; indice++)
    {
        diferencia |= datos_a[indice] ^ datos_b[indice];
    }
    return diferencia === 0;
}

async function mgf1(semilla, longitud_mascara)
{
    // Concatena SHA-256(semilla || contador) hasta cubrir la longitud pedida
    const bloques = [];
    let longitud_acumulada = 0;
    let contador = 0;
    while (longitud_acumulada < longitud_mascara)
    {
        const contador_bytes = entero_a_bytes(BigInt(contador), 4);
        const bloque = await sha256(concatenar_bytes([semilla, contador_bytes]));
        bloques.push(bloque);
        longitud_acumulada += bloque.length;
        contador++;
    }
    return concatenar_bytes(bloques).slice(0, longitud_mascara);
}

function notificar(registrar, nombre, valor)
{
    if (registrar)
    {
        registrar(nombre, valor);
    }
}

async function codificar_oaep(mensaje, longitud_bloque, etiqueta, registrar)
{
    const max_longitud_mensaje = longitud_bloque - 2 * LONGITUD_HASH - 2;
    if (mensaje.length > max_longitud_mensaje)
    {
        return null;
    }

    // DB = lHash || PS || 0x01 || M
    const hash_etiqueta = await sha256(etiqueta);
    const relleno_ceros = new Uint8Array(max_longitud_mensaje - mensaje.length);
    const bloque_datos = concatenar_bytes([hash_etiqueta, relleno_ceros, new Uint8Array([1]), mensaje]);
    notificar(registrar, "lHash = SHA-256(etiqueta)", hash_etiqueta);
    notificar(registrar, `DB (${bloque_datos.length} bytes, ${relleno_ceros.length} de relleno)`, bloque_datos);

    // La semilla aleatoria hace que cifrar dos veces lo mismo produzca resultados distintos
    const semilla = crypto.getRandomValues(new Uint8Array(LONGITUD_HASH));
    notificar(registrar, "Semilla aleatoria", semilla);

    const mascara_datos = await mgf1(semilla, longitud_bloque - LONGITUD_HASH - 1);
    const bloque_datos_enmascarado = xor_bytes(bloque_datos, mascara_datos);
    notificar(registrar, "maskedDB = DB XOR MGF1(semilla)", bloque_datos_enmascarado);

    const mascara_semilla = await mgf1(bloque_datos_enmascarado, LONGITUD_HASH);
    const semilla_enmascarada = xor_bytes(semilla, mascara_semilla);
    notificar(registrar, "maskedSeed = semilla XOR MGF1(maskedDB)", semilla_enmascarada);

    // EM = 0x00 || maskedSeed || maskedDB
    return concatenar_bytes([new Uint8Array([0]), semilla_enmascarada, bloque_datos_enmascarado]);
}

async function decodificar_oaep(bloque_codificado, longitud_bloque, etiqueta, registrar)
{
    const byte_inicial = bloque_codificado[0];
    const semilla_enmascarada = bloque_codificado.slice(1, 1 + LONGITUD_HASH);
    const bloque_datos_enmascarado = bloque_codificado.slice(1 + LONGITUD_HASH);

    const mascara_semilla = await mgf1(bloque_datos_enmascarado, LONGITUD_HASH);
    const semilla = xor_bytes(semilla_enmascarada, mascara_semilla);
    notificar(registrar, "Semilla recuperada", semilla);

    const mascara_datos = await mgf1(semilla, longitud_bloque - LONGITUD_HASH - 1);
    const bloque_datos = xor_bytes(bloque_datos_enmascarado, mascara_datos);
    notificar(registrar, "DB recuperado", bloque_datos);

    const hash_etiqueta_recibido = bloque_datos.slice(0, LONGITUD_HASH);
    const resto = bloque_datos.slice(LONGITUD_HASH);

    // Buscar el separador 0x01 recorriendo todo el bloque (sin salir antes)
    let indice_separador = -1;
    let relleno_valido = true;
    for (let indice = 0; indice < resto.length; indice++)
    {
        if (indice_separador === -1)
        {
            if (resto[indice] === 1)
            {
                indice_separador = indice;
            }
            else if (resto[indice] !== 0)
            {
                relleno_valido = false;
            }
        }
    }

    const etiqueta_valida = son_iguales(hash_etiqueta_recibido, await sha256(etiqueta));

    // Un solo error generico: no revelar cual verificacion fallo (ataque de Manger)
    if (byte_inicial !== 0 || !etiqueta_valida || !relleno_valido || indice_separador === -1)
    {
        return null;
    }
    return resto.slice(indice_separador + 1);
}

export async function cifrar_oaep(mensaje, llave_publica, etiqueta, registrar)
{
    const longitud_bloque = longitud_modulo(llave_publica);

    const bloque_codificado = await codificar_oaep(mensaje, longitud_bloque, etiqueta, registrar);
    if (bloque_codificado === null)
    {
        return null;
    }

    // c = EM^e mod n
    const entero_cifrado = potencia_modular(bytes_a_entero(bloque_codificado), llave_publica.e, llave_publica.n);
    return entero_a_bytes(entero_cifrado, longitud_bloque);
}

export async function descifrar_oaep(cifrado, llave_privada, etiqueta, registrar)
{
    const longitud_bloque = longitud_modulo(llave_privada);
    if (cifrado.length !== longitud_bloque)
    {
        return null;
    }

    const entero_cifrado = bytes_a_entero(cifrado);
    if (entero_cifrado >= llave_privada.n)
    {
        return null;
    }

    // EM = c^d mod n
    const entero_mensaje = potencia_modular(entero_cifrado, llave_privada.d, llave_privada.n);
    const bloque_codificado = entero_a_bytes(entero_mensaje, longitud_bloque);
    notificar(registrar, "EM = CK^d mod n", bloque_codificado);
    return decodificar_oaep(bloque_codificado, longitud_bloque, etiqueta, registrar);
}
