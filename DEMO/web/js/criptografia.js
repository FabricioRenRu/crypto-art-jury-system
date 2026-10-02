import { bytes_a_hex, hex_a_bytes, potencia_modular } from "./oaep.js";

export const LONGITUD_LLAVE_AES = 32;  // AES-256
export const LONGITUD_IV = 12;         // IV recomendado para GCM
export const LONGITUD_ETIQUETA_GCM = 16;
const PREFIJO_ETIQUETA_OAEP = "concurso-pintura:obra:";  // Igual que en sobre_llave.py

export function texto_a_bytes(texto)
{
    return new TextEncoder().encode(texto);
}

export function bytes_aleatorios(cantidad)
{
    return crypto.getRandomValues(new Uint8Array(cantidad));
}

export function construir_etiqueta_oaep(id_obra)
{
    // La etiqueta amarra el sobre a su obra: no se puede reutilizar con otra pintura
    return texto_a_bytes(PREFIJO_ETIQUETA_OAEP + id_obra);
}

export async function sha256(datos)
{
    return new Uint8Array(await crypto.subtle.digest("SHA-256", datos));
}

export function bytes_a_base64(bytes)
{
    // Se procesa por bloques para no rebasar la pila con imagenes grandes
    const TAMANO_BLOQUE = 0x8000;
    let texto_binario = "";
    for (let inicio = 0; inicio < bytes.length; inicio += TAMANO_BLOQUE)
    {
        const bloque = bytes.subarray(inicio, inicio + TAMANO_BLOQUE);
        texto_binario += String.fromCharCode.apply(null, bloque);
    }
    return btoa(texto_binario);
}

export function base64_a_bytes(texto_base64)
{
    const texto_binario = atob(texto_base64);
    const bytes = new Uint8Array(texto_binario.length);
    for (let indice = 0; indice < texto_binario.length; indice++)
    {
        bytes[indice] = texto_binario.charCodeAt(indice);
    }
    return bytes;
}

// AES-256-GCM (Etapa 2)

async function importar_llave_aes(llave_bytes, usos)
{
    return crypto.subtle.importKey("raw", llave_bytes, { name: "AES-GCM" }, false, usos);
}

export async function cifrar_aes_gcm(llave_bytes, datos)
{
    const iv = bytes_aleatorios(LONGITUD_IV);
    const llave = await importar_llave_aes(llave_bytes, ["encrypt"]);
    const cifrado = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, llave, datos);
    return { iv: iv, cifrado: new Uint8Array(cifrado) };
}

export async function descifrar_aes_gcm(llave_bytes, iv, cifrado)
{
    const llave = await importar_llave_aes(llave_bytes, ["decrypt"]);
    try
    {
        const claro = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, llave, cifrado);
        return new Uint8Array(claro);
    }
    catch (error)
    {
        // GCM rechaza el descifrado si la etiqueta de autenticacion no coincide
        return null;
    }
}

// Firma ECDSA P-256 del consentimiento (Etapa 1)

const PARAMETROS_ECDSA = { name: "ECDSA", namedCurve: "P-256" };
const PARAMETROS_FIRMA = { name: "ECDSA", hash: "SHA-256" };

export async function generar_llaves_firma()
{
    const par_llaves = await crypto.subtle.generateKey(PARAMETROS_ECDSA, true, ["sign", "verify"]);
    const publica_jwk = await crypto.subtle.exportKey("jwk", par_llaves.publicKey);
    return { privada: par_llaves.privateKey, publica_jwk: publica_jwk };
}

export async function firmar_documento(llave_privada, documento_bytes)
{
    // ECDSA con SHA-256: se firma el hash SHA-256 del documento
    const firma = await crypto.subtle.sign(PARAMETROS_FIRMA, llave_privada, documento_bytes);
    return new Uint8Array(firma);
}

export async function verificar_firma(publica_jwk, documento_bytes, firma)
{
    const llave_publica = await crypto.subtle.importKey("jwk", publica_jwk, PARAMETROS_ECDSA, false, ["verify"]);
    return crypto.subtle.verify(PARAMETROS_FIRMA, llave_publica, firma, documento_bytes);
}

// Llaves RSA del jurado (Etapa 3)

function base64url_a_entero(texto_base64url)
{
    let texto_base64 = texto_base64url.replace(/-/g, "+").replace(/_/g, "/");
    while (texto_base64.length % 4 !== 0)
    {
        texto_base64 += "=";
    }
    return BigInt("0x" + bytes_a_hex(base64_a_bytes(texto_base64)));
}

function entero_a_base64url(numero)
{
    const texto_base64 = bytes_a_base64(hex_a_bytes(numero.toString(16)));
    return texto_base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function inverso_modular(valor, modulo)
{
    // Euclides extendido iterativo
    let residuo_anterior = valor % modulo;
    let residuo_actual = modulo;
    let coeficiente_anterior = 1n;
    let coeficiente_actual = 0n;
    while (residuo_actual !== 0n)
    {
        const cociente = residuo_anterior / residuo_actual;
        [residuo_anterior, residuo_actual] = [residuo_actual, residuo_anterior - cociente * residuo_actual];
        [coeficiente_anterior, coeficiente_actual] = [coeficiente_actual, coeficiente_anterior - cociente * coeficiente_actual];
    }
    if (residuo_anterior !== 1n)
    {
        return null;
    }
    return ((coeficiente_anterior % modulo) + modulo) % modulo;
}

export async function generar_llaves_rsa()
{
    const parametros = {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
    };
    const par_llaves = await crypto.subtle.generateKey(parametros, true, ["encrypt", "decrypt"]);
    const privada_jwk = await crypto.subtle.exportKey("jwk", par_llaves.privateKey);

    return {
        n: base64url_a_entero(privada_jwk.n),
        e: base64url_a_entero(privada_jwk.e),
        d: base64url_a_entero(privada_jwk.d),
        p: base64url_a_entero(privada_jwk.p),
        q: base64url_a_entero(privada_jwk.q),
    };
}

export function llave_a_json_hex(llave)
{
    // Mismo formato que rsa_llaves.py: cada valor en hexadecimal
    const llave_hex = {};
    for (const nombre of Object.keys(llave))
    {
        llave_hex[nombre] = llave[nombre].toString(16);
    }
    return llave_hex;
}

export function llave_desde_json_hex(objeto)
{
    if (typeof objeto !== "object" || objeto === null || !objeto.n || !objeto.e || !objeto.d)
    {
        return null;
    }

    const llave = {};
    for (const nombre of ["n", "e", "d", "p", "q"])
    {
        if (objeto[nombre] !== undefined)
        {
            if (!/^[0-9a-fA-F]+$/.test(objeto[nombre]))
            {
                return null;
            }
            llave[nombre] = BigInt("0x" + objeto[nombre]);
        }
    }

    // Comprobacion rapida de que e y d son inversos: (2^e)^d mod n debe regresar 2
    if (potencia_modular(potencia_modular(2n, llave.e, llave.n), llave.d, llave.n) !== 2n)
    {
        return null;
    }
    return llave;
}

export function parte_publica(llave)
{
    return { n: llave.n, e: llave.e };
}

export async function huella_llave(llave)
{
    const huella = await sha256(texto_a_bytes(llave.n.toString(16)));
    return bytes_a_hex(huella).substring(0, 16);
}

export async function descifrar_con_webcrypto(sobre, llave_privada, etiqueta)
{
    // Segunda implementacion (la del navegador) para comprobar que nuestro OAEP sigue el estandar
    if (llave_privada.p === undefined || llave_privada.q === undefined)
    {
        return null;
    }

    const llave_jwk = {
        kty: "RSA",
        alg: "RSA-OAEP-256",
        ext: true,
        n: entero_a_base64url(llave_privada.n),
        e: entero_a_base64url(llave_privada.e),
        d: entero_a_base64url(llave_privada.d),
        p: entero_a_base64url(llave_privada.p),
        q: entero_a_base64url(llave_privada.q),
        dp: entero_a_base64url(llave_privada.d % (llave_privada.p - 1n)),
        dq: entero_a_base64url(llave_privada.d % (llave_privada.q - 1n)),
        qi: entero_a_base64url(inverso_modular(llave_privada.q, llave_privada.p)),
    };

    try
    {
        const llave = await crypto.subtle.importKey("jwk", llave_jwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
        const claro = await crypto.subtle.decrypt({ name: "RSA-OAEP", label: etiqueta }, llave, sobre);
        return new Uint8Array(claro);
    }
    catch (error)
    {
        return null;
    }
}
