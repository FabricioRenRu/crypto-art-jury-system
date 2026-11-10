import base64
import hashlib
import math

from Crypto.Hash import SHA256
from Crypto.PublicKey import ECC, RSA
from Crypto.Signature import DSS, pss

from aes_utils import TAM_NONCE, TAM_TAG, _a_bytes, _aad, obtener_llave_sesion
from blind_signature_utils import _factor_r, _full_domain_hash, _llave_juez, texto_evaluacion_canonico
from session_utils import obtener_llave_actual, obtener_llave_presidente, obtener_rol_actual
from sobre_llave_utils import construir_etiqueta
from sobre_pintor_utils import SAL_HKDF, _llave_del_sobre


def _a_python(valor):
    return valor.to_py() if hasattr(valor, "to_py") else valor


def _fila(etiqueta, valor, nota=""):
    return {"etiqueta": etiqueta, "valor": str(valor), "nota": nota}


def _seccion(titulo, filas, descripcion=""):
    return {"titulo": titulo, "descripcion": descripcion, "filas": filas}


def _hex(datos):
    return datos.hex()


def _entero_hex(numero):
    return format(numero, "x")


def _bits(numero):
    return f"{numero.bit_length()} bits"


def _ok(condicion, texto_ok, texto_mal):
    return ("✔ " + texto_ok) if condicion else ("✘ " + texto_mal)


def _xor(a, b):
    return bytes(x ^ y for x, y in zip(a, b))


def _mgf1(semilla, longitud):
    return pss.MGF1(semilla, longitud, SHA256)


def describir_llave_ecdsa(payload_js):
    payload = _a_python(payload_js)
    llave = ECC.import_key(payload["pem"])
    d = int(llave.d)
    x = int(llave.pointQ.x)
    y = int(llave.pointQ.y)
    recalculada = ECC.construct(curve="P-256", d=d)
    coincide = int(recalculada.pointQ.x) == x and int(recalculada.pointQ.y) == y
    p = 2**256 - 2**224 + 2**192 + 2**96 - 1
    b = int("5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b", 16)
    en_curva = (y * y - (x * x * x - 3 * x + b)) % p == 0
    return {"secciones": [
        _seccion("Curva elíptica NIST P-256", [
            _fila("Ecuación", "y² = x³ − 3x + b (mod p)"),
            _fila("p (primo del campo)", _entero_hex(p), _bits(p)),
            _fila("b", _entero_hex(b)),
            _fila("n (orden del punto G)", "ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551", "256 bits"),
        ], "Parámetros públicos de la curva sobre la que se generó la llave."),
        _seccion("Llave privada d (se queda en tu computadora)", [
            _fila("d (hex)", _entero_hex(d), _bits(d)),
            _fila("d (decimal)", d),
        ], "Número aleatorio entre 1 y n−1. Es lo que se descarga en el archivo .pem."),
        _seccion("Llave pública Q = d·G (se manda al servidor)", [
            _fila("Qx", _entero_hex(x)),
            _fila("Qy", _entero_hex(y)),
            _fila("Q está en la curva", _ok(en_curva, "y² ≡ x³ − 3x + b (mod p)", "no cumple la ecuación")),
            _fila("Q = d·G", _ok(coincide, "recalculado a partir de d", "no coincide")),
            _fila("PEM público", llave.public_key().export_key(format="PEM")),
        ], "Multiplicar el punto generador G por d es fácil; recuperar d a partir de Q es el problema del logaritmo discreto."),
    ]}


def describir_cifrado_aes(payload_js):
    payload = _a_python(payload_js)
    id_pintura = str(payload["id_pintura"])
    paquete = _a_bytes(payload["cifrado"])
    llave = obtener_llave_sesion(id_pintura)
    nonce = paquete[:TAM_NONCE]
    ciphertext = paquete[TAM_NONCE:-TAM_TAG]
    tag = paquete[-TAM_TAG:]
    return {"secciones": [
        _seccion("AES-256-GCM: cifrado de la imagen", [
            _fila("K_AES (32 bytes aleatorios)", _hex(llave) if llave else "no disponible", "256 bits, solo vive en la RAM del worker"),
            _fila("Nonce / IV", _hex(nonce), f"{len(nonce)} bytes aleatorios"),
            _fila("AAD (datos asociados)", _aad(id_pintura).decode("utf-8"), "se autentican pero no se cifran"),
            _fila("Imagen original", f"{payload.get('tam_original', len(ciphertext))} bytes", "SHA-256: " + str(payload.get("hash_original", ""))),
            _fila("Ciphertext (primeros 64 bytes)", _hex(ciphertext[:64]) + "…", f"{len(ciphertext)} bytes en total, mismo tamaño que la imagen"),
            _fila("Tag de autenticación GCM", _hex(tag), f"{len(tag)} bytes"),
            _fila("Paquete que se sube", f"nonce({len(nonce)}) ‖ ciphertext({len(ciphertext)}) ‖ tag({len(tag)}) = {len(paquete)} bytes"),
            _fila("SHA-256 del paquete", hashlib.sha256(paquete).hexdigest(), "es el hash que firma el consentimiento ECDSA"),
        ], "El servidor solo recibe el paquete cifrado. Sin K_AES no puede ver la imagen y cualquier cambio rompe el tag."),
    ]}


def describir_sobres(payload_js):
    payload = _a_python(payload_js)
    id_pintura = str(payload["id_pintura"])
    etiqueta = construir_etiqueta(id_pintura)
    llave = obtener_llave_sesion(id_pintura)
    secciones = [
        _seccion("RSA-OAEP: parámetros del sobre", [
            _fila("Mensaje M", _hex(llave) if llave else "no disponible", "la K_AES de la obra (32 bytes)"),
            _fila("Hash", "SHA-256 (hLen = 32 bytes)"),
            _fila("MGF", "MGF1 con SHA-256"),
            _fila("Etiqueta L", etiqueta.decode("utf-8"), "amarra el sobre a esta obra"),
            _fila("lHash = SHA-256(L)", hashlib.sha256(etiqueta).hexdigest()),
            _fila("Bloque", "EM = 0x00 ‖ maskedSeed ‖ maskedDB,  DB = lHash ‖ PS ‖ 0x01 ‖ M"),
            _fila("Cifrado", "c = EM^e mod n con la llave pública de cada juez"),
        ], "Se genera un sobre por juez. Una semilla aleatoria hace que cada sobre sea distinto aunque M sea la misma."),
    ]
    sobres = payload["sobres"]
    for juez in payload["jueces"]:
        id_juez = str(juez["id"])
        publica = RSA.import_key(juez["clave_publica_rsa"])
        sobre = base64.b64decode(sobres.get(id_juez, ""))
        secciones.append(_seccion(f"Sobre para {juez.get('nombre') or id_juez}", [
            _fila("n del juez", _entero_hex(publica.n), _bits(publica.n)),
            _fila("e del juez", publica.e),
            _fila("Sobre c (hex)", _hex(sobre), f"{len(sobre)} bytes"),
            _fila("Sobre c (base64, lo que se guarda)", sobres.get(id_juez, "")),
        ]))
    return {"secciones": secciones}


def describir_sobre_pintor(payload_js):
    payload = _a_python(payload_js)
    id_pintura = str(payload["id_pintura"])
    sobre = base64.b64decode(payload["sobre_pintor"])
    llave_derivada = _llave_del_sobre(id_pintura)
    return {"secciones": [
        _seccion("Sobre del pintor (HKDF + AES-GCM)", [
            _fila("Material de entrada", "d de tu llave privada ECDSA"),
            _fila("Sal HKDF", SAL_HKDF.decode("utf-8")),
            _fila("Contexto HKDF", f"sobre-pintor:{id_pintura}"),
            _fila("Llave derivada K_pintor", _hex(llave_derivada), "HKDF-SHA256, 32 bytes"),
            _fila("Nonce", _hex(sobre[:TAM_NONCE])),
            _fila("K_AES cifrada", _hex(sobre[TAM_NONCE:-TAM_TAG])),
            _fila("Tag", _hex(sobre[-TAM_TAG:])),
            _fila("Sobre (base64)", payload["sobre_pintor"], f"{len(sobre)} bytes"),
        ], "Así puedes volver a ver tu obra en otra sesión: solo tu .pem permite derivar K_pintor."),
    ]}


def describir_firma_ecdsa(payload_js):
    payload = _a_python(payload_js)
    documento = payload["documento"].encode("utf-8")
    firma = bytes.fromhex(payload["firma_hex"])
    r = int.from_bytes(firma[:32], "big")
    s = int.from_bytes(firma[32:], "big")
    publica = ECC.import_key(obtener_llave_actual()).public_key()
    try:
        DSS.new(publica, "fips-186-3").verify(SHA256.new(documento), firma)
        valida = True
    except ValueError:
        valida = False
    return {"secciones": [
        _seccion("ECDSA P-256: firma del consentimiento", [
            _fila("Documento firmado", payload["documento"]),
            _fila("e = SHA-256(documento)", hashlib.sha256(documento).hexdigest()),
            _fila("r = (k·G).x mod n", _entero_hex(r), "k es un número aleatorio de un solo uso"),
            _fila("s = k⁻¹(e + r·d) mod n", _entero_hex(s)),
            _fila("Firma r ‖ s", payload["firma_hex"], f"{len(firma)} bytes"),
            _fila("Verificación con Q", _ok(valida, "la firma es válida con tu llave pública", "la firma no es válida")),
        ], "El servidor verifica la firma con tu llave pública y así sabe que tú autorizaste esta obra."),
    ]}


def _llave_rsa_sesion():
    if obtener_rol_actual() not in ("jurado", "presidente"):
        raise ValueError("No hay una llave RSA en la sesión.")
    return RSA.import_key(obtener_llave_actual())


def describir_llave_rsa(payload_js=None):
    llave = _llave_rsa_sesion()
    n, e, d, p, q = llave.n, llave.e, llave.d, llave.p, llave.q
    phi = (p - 1) * (q - 1)
    lam = phi // math.gcd(p - 1, q - 1)
    rol = "del presidente" if obtener_rol_actual() == "presidente" else "del juez"
    return {"secciones": [
        _seccion(f"Primos de la llave RSA {rol}", [
            _fila("p", p, _bits(p)),
            _fila("q", q, _bits(q)),
            _fila("n = p · q", n, _bits(n)),
            _fila("Comprobación", _ok(p * q == n, "p · q = n", "p · q ≠ n")),
        ], "Factorizar n para encontrar p y q es lo que hace segura a RSA."),
        _seccion("Exponentes", [
            _fila("φ(n) = (p−1)(q−1)", phi),
            _fila("λ(n) = mcm(p−1, q−1)", lam),
            _fila("e (público)", e),
            _fila("d = e⁻¹ mod λ(n) (privado)", d, _bits(d)),
            _fila("Comprobación", _ok((e * d) % lam == 1, "e · d ≡ 1 (mod λ(n))", "e · d no es 1 mod λ(n)")),
        ]),
        _seccion("Valores CRT del archivo .pem", [
            _fila("dP = d mod (p−1)", d % (p - 1)),
            _fila("dQ = d mod (q−1)", d % (q - 1)),
            _fila("qInv = q⁻¹ mod p", pow(q, -1, p)),
        ], "Con el teorema chino del residuo se descifra unas 4 veces más rápido."),
    ]}


def describir_sobre_juez(payload_js):
    payload = _a_python(payload_js)
    id_pintura = str(payload["id_pintura"])
    llave = _llave_rsa_sesion()
    sobre = base64.b64decode(payload["sobre"])
    k = (llave.n.bit_length() + 7) // 8
    h_len = 32
    m = pow(int.from_bytes(sobre, "big"), llave.d, llave.n)
    em = m.to_bytes(k, "big")
    masked_seed = em[1:1 + h_len]
    masked_db = em[1 + h_len:]
    seed_mask = _mgf1(masked_db, h_len)
    seed = _xor(masked_seed, seed_mask)
    db_mask = _mgf1(seed, k - h_len - 1)
    db = _xor(masked_db, db_mask)
    etiqueta = construir_etiqueta(id_pintura)
    l_hash = hashlib.sha256(etiqueta).digest()
    separador = db.find(b"\x01", h_len)
    ps = db[h_len:separador]
    mensaje = db[separador + 1:]
    llave_sesion = obtener_llave_sesion(id_pintura)
    return {"secciones": [
        _seccion("Sobre RSA-OAEP recibido", [
            _fila("c (hex)", _hex(sobre), f"{len(sobre)} bytes"),
            _fila("EM = c^d mod n", _hex(em), f"{len(em)} bytes"),
        ], "Paso 1: se descifra con la llave privada del juez."),
        _seccion("Deshacer el relleno OAEP", [
            _fila("Y (primer byte)", f"0x{em[0]:02x}", _ok(em[0] == 0, "debe ser 0x00", "no es 0x00")),
            _fila("maskedSeed", _hex(masked_seed), "32 bytes"),
            _fila("maskedDB", _hex(masked_db), f"{len(masked_db)} bytes"),
            _fila("seedMask = MGF1(maskedDB)", _hex(seed_mask)),
            _fila("seed = maskedSeed ⊕ seedMask", _hex(seed)),
            _fila("dbMask = MGF1(seed)", _hex(db_mask)),
            _fila("DB = maskedDB ⊕ dbMask", _hex(db)),
        ], "Paso 2: con MGF1-SHA256 se quitan las dos máscaras."),
        _seccion("Partes de DB", [
            _fila("lHash' (de DB)", _hex(db[:h_len])),
            _fila("lHash = SHA-256(etiqueta)", _hex(l_hash), etiqueta.decode("utf-8")),
            _fila("Etiqueta", _ok(db[:h_len] == l_hash, "coincide: el sobre es de esta obra", "no coincide")),
            _fila("PS", f"{len(ps)} bytes en 0x00"),
            _fila("Separador", "0x01"),
            _fila("M = K_AES", _hex(mensaje), f"{len(mensaje)} bytes"),
            _fila("K_AES en el worker", _ok(llave_sesion == mensaje, "es la misma que abrió la imagen", "no coincide")),
        ], "Paso 3: si lHash coincide y el formato es correcto, M es la llave AES de la pintura."),
    ]}


def describir_cegado(payload_js):
    payload = _a_python(payload_js)
    llave_juez = _llave_juez()
    id_pintura = str(payload["id_pintura"])
    texto = texto_evaluacion_canonico(
        id_pintura, str(payload["id_juez"]), int(payload["estrellas"]), str(payload["comentario"]).strip()
    )
    presidente = obtener_llave_presidente()
    n, e = presidente.n, presidente.e
    h = _full_domain_hash(texto.encode("utf-8"), n.bit_length())
    r = _factor_r(llave_juez, n, id_pintura)
    r_e = pow(r, e, n)
    h_cegado = (h * r_e) % n
    return {"secciones": [
        _seccion("Firma ciega de Chaum: cegado de tu evaluación", [
            _fila("Evaluación canónica", texto),
            _fila("h = FDH-SHA256(evaluación)", _entero_hex(h), _bits(h)),
            _fila("n del presidente", _entero_hex(n), _bits(n)),
            _fila("e del presidente", e),
            _fila("r (factor de cegado secreto)", _entero_hex(r), "derivado con HKDF de tu llave privada"),
            _fila("r^e mod n", _entero_hex(r_e)),
            _fila("h' = h · r^e mod n", _entero_hex(h_cegado)),
            _fila("h' enviado al servidor", _ok(str(h_cegado) == str(payload.get("h_blinded", "")), "es el mismo valor", "no coincide")),
        ], "El presidente solo verá h'. Sin r no puede saber qué calificación firmó."),
    ]}


def describir_firma_ciega(payload_js):
    payload = _a_python(payload_js)
    if obtener_rol_actual() != "presidente":
        raise ValueError("Solo el presidente firma a ciegas.")
    llave = RSA.import_key(obtener_llave_actual())
    secciones = []
    for indice, voto in enumerate(payload["votos"], start=1):
        h_cegado = int(voto["h_blinded"])
        s_cegada = int(voto["s_blinded"])
        secciones.append(_seccion(f"Voto cegado {indice}: {voto.get('id', '')[:8].upper()}", [
            _fila("h' recibido", _entero_hex(h_cegado), _bits(h_cegado)),
            _fila("s' = h'^d mod n", _entero_hex(s_cegada), _bits(s_cegada)),
            _fila("Comprobación", _ok(pow(s_cegada, llave.e, llave.n) == h_cegado, "s'^e mod n = h'", "s'^e mod n ≠ h'")),
        ], "El juez después calcula s = s' · r⁻¹ mod n y obtiene la firma de su evaluación real."))
    return {"secciones": secciones}
