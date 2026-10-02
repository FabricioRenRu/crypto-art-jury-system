import * as api from "./api_servidor.js";
import * as cripto from "./criptografia.js";
import { cifrar_oaep, descifrar_oaep, bytes_a_hex, hex_a_bytes } from "./oaep.js";

const CLAVE_ALMACEN_JURADO = "dispositivo_jurado_llaves";
const TAMANO_MAXIMO_PINTURA = 15 * 1024 * 1024;
const LARGO_INICIO_HEX = 48;
const LARGO_FINAL_HEX = 16;
const LADO_MAXIMO_LIENZO = 180;
const DECLARACION_CONSENTIMIENTO = "Acepto las bases del concurso y autorizo la evaluacion anonima de mi obra.";

const estado_pintor = {
    llaves_firma: null,
    bytes_pintura: null,
    tipo_mime: "",
    url_vista_previa: null,
};
const llaves_jurado = {};  // id_juez -> llave privada {n, e, d, p, q}
let url_obra_descifrada = null;

// Utilidades de interfaz

function obtener(id_elemento)
{
    return document.getElementById(id_elemento);
}

function crear_elemento(etiqueta, clase, texto)
{
    const elemento = document.createElement(etiqueta);
    if (clase)
    {
        elemento.className = clase;
    }
    if (texto !== undefined)
    {
        elemento.textContent = texto;
    }
    return elemento;
}

function mostrar_mensaje(id_elemento, texto, tipo)
{
    const elemento = obtener(id_elemento);
    elemento.textContent = texto;
    elemento.className = "mensaje";
    if (tipo)
    {
        elemento.classList.add(tipo);
    }
}

function formatear_valor(valor)
{
    if (valor instanceof Uint8Array)
    {
        const texto_hex = bytes_a_hex(valor);
        if (texto_hex.length <= LARGO_INICIO_HEX + LARGO_FINAL_HEX)
        {
            return `${texto_hex} (${valor.length} bytes)`;
        }
        const inicio = texto_hex.substring(0, LARGO_INICIO_HEX);
        const final = texto_hex.substring(texto_hex.length - LARGO_FINAL_HEX);
        return `${inicio}...${final} (${valor.length} bytes)`;
    }
    return String(valor);
}

function crear_bitacora(id_lista)
{
    const lista = obtener(id_lista);

    function agregar(clase, texto, valor)
    {
        const entrada = crear_elemento("li", clase, texto);
        if (valor !== undefined && valor !== null)
        {
            entrada.appendChild(crear_elemento("span", "valor", formatear_valor(valor)));
        }
        lista.appendChild(entrada);
        lista.scrollTop = lista.scrollHeight;
    }

    return {
        limpiar: function ()
        {
            lista.replaceChildren();
        },
        etapa: function (texto)
        {
            agregar("etapa", texto);
        },
        dato: function (texto, valor)
        {
            agregar("", texto, valor);
        },
        ok: function (texto, valor)
        {
            agregar("ok", texto, valor);
        },
        falla: function (texto, valor)
        {
            agregar("falla", texto, valor);
        },
    };
}

function llave_publica_desde_hex(publica_hex)
{
    return { n: BigInt("0x" + publica_hex.n), e: BigInt("0x" + publica_hex.e) };
}

function formatear_bytes(cantidad)
{
    return cantidad.toLocaleString("es-MX");
}

// Dispositivo del pintor (Etapas 1, 2 y 3)

function inicializar_pintor()
{
    obtener("archivo_pintura").addEventListener("change", cargar_pintura);

    for (const opcion of document.querySelectorAll('input[name="modo_llave_aes"]'))
    {
        opcion.addEventListener("change", function ()
        {
            obtener("contenedor_llave_manual").hidden = obtener_modo_llave_aes() !== "manual";
        });
    }

    obtener("boton_llave_aleatoria").addEventListener("click", function ()
    {
        obtener("llave_aes_manual").value = bytes_a_hex(cripto.bytes_aleatorios(cripto.LONGITUD_LLAVE_AES));
    });

    obtener("formulario_pintor").addEventListener("submit", function (evento)
    {
        evento.preventDefault();
        procesar_envio_obra();
    });

    const bitacora = crear_bitacora("bitacora_pintor");
    bitacora.etapa("Dispositivo listo");
    bitacora.dato("Par de llaves ECDSA P-256 del pintor generado aqui; la llave privada no sale de este navegador");
}

async function cargar_pintura(evento)
{
    const archivo = evento.target.files[0];
    const vista_previa = obtener("vista_previa_pintura");
    estado_pintor.bytes_pintura = null;
    vista_previa.hidden = true;

    if (!archivo)
    {
        return;
    }
    if (!archivo.type.startsWith("image/"))
    {
        mostrar_mensaje("mensaje_pintor", "El archivo debe ser una imagen (PNG, JPG, WEBP...).", "error");
        return;
    }
    if (archivo.size > TAMANO_MAXIMO_PINTURA)
    {
        mostrar_mensaje("mensaje_pintor", "La imagen supera 15 MB. Elige un archivo mas ligero.", "error");
        return;
    }

    estado_pintor.bytes_pintura = new Uint8Array(await archivo.arrayBuffer());
    estado_pintor.tipo_mime = archivo.type;

    if (estado_pintor.url_vista_previa)
    {
        URL.revokeObjectURL(estado_pintor.url_vista_previa);
    }
    estado_pintor.url_vista_previa = URL.createObjectURL(archivo);
    vista_previa.src = estado_pintor.url_vista_previa;
    vista_previa.alt = `Vista previa de ${archivo.name}`;
    vista_previa.hidden = false;
    mostrar_mensaje("mensaje_pintor", "");
}

function obtener_modo_llave_aes()
{
    return document.querySelector('input[name="modo_llave_aes"]:checked').value;
}

function leer_llave_aes()
{
    if (obtener_modo_llave_aes() === "automatica")
    {
        return cripto.bytes_aleatorios(cripto.LONGITUD_LLAVE_AES);
    }

    const texto_llave = obtener("llave_aes_manual").value.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(texto_llave))
    {
        return null;
    }
    return hex_a_bytes(texto_llave);
}

function obtener_jueces_destino()
{
    const jueces = [];
    for (const casilla of obtener("lista_jueces_destino").querySelectorAll("input:checked"))
    {
        jueces.push(casilla.value);
    }
    return jueces;
}

function mostrar_jueces_destino(jurado)
{
    const contenedor = obtener("lista_jueces_destino");
    const desmarcados = new Set();
    for (const casilla of contenedor.querySelectorAll("input:not(:checked)"))
    {
        desmarcados.add(casilla.value);
    }

    contenedor.replaceChildren();
    const ids_jueces = Object.keys(jurado).sort();
    if (ids_jueces.length === 0)
    {
        contenedor.appendChild(crear_elemento("p", "vacio", "Aun no hay jueces con llave publica. Genera una en el dispositivo del jurado."));
        return;
    }

    for (const id_juez of ids_jueces)
    {
        const etiqueta = crear_elemento("label", "opcion");
        const casilla = document.createElement("input");
        casilla.type = "checkbox";
        casilla.value = id_juez;
        casilla.checked = !desmarcados.has(id_juez);
        etiqueta.appendChild(casilla);
        etiqueta.appendChild(document.createTextNode(`${id_juez} (llave publica registrada)`));
        contenedor.appendChild(etiqueta);
    }
}

async function procesar_envio_obra()
{
    const nombre_pintor = obtener("nombre_pintor").value.trim();
    const titulo_obra = obtener("titulo_obra").value.trim();

    if (nombre_pintor === "" || titulo_obra === "")
    {
        mostrar_mensaje("mensaje_pintor", "Escribe tu nombre y el titulo de la obra.", "error");
        return;
    }
    if (estado_pintor.bytes_pintura === null)
    {
        mostrar_mensaje("mensaje_pintor", "Selecciona la imagen de tu pintura.", "error");
        return;
    }
    if (!obtener("acepto_bases").checked)
    {
        mostrar_mensaje("mensaje_pintor", "Debes aceptar las bases para firmar el consentimiento.", "error");
        return;
    }

    const jueces_destino = obtener_jueces_destino();
    if (jueces_destino.length === 0)
    {
        mostrar_mensaje("mensaje_pintor", "Selecciona al menos un juez. Si no aparece ninguno, genera sus llaves primero.", "error");
        return;
    }

    const llave_sesion = leer_llave_aes();
    if (llave_sesion === null)
    {
        mostrar_mensaje("mensaje_pintor", "La llave K_AES debe tener exactamente 64 caracteres hexadecimales (0-9, a-f).", "error");
        return;
    }

    const boton = obtener("boton_enviar_obra");
    boton.disabled = true;
    mostrar_mensaje("mensaje_pintor", "Firmando y cifrando en este dispositivo...");

    try
    {
        await ejecutar_etapas_pintor(nombre_pintor, titulo_obra, jueces_destino, llave_sesion);
    }
    finally
    {
        llave_sesion.fill(0);
        boton.disabled = false;
    }
}

async function ejecutar_etapas_pintor(nombre_pintor, titulo_obra, jueces_destino, llave_sesion)
{
    const bitacora = crear_bitacora("bitacora_pintor");
    bitacora.limpiar();

    const reserva = await api.reservar_obra();
    if (!reserva.ok)
    {
        mostrar_mensaje("mensaje_pintor", reserva.error, "error");
        return;
    }
    const id_obra = reserva.datos.id_obra;
    bitacora.etapa(`Obra ${id_obra}: identificador reservado en el servidor`);

    // Etapa 1: consentimiento firmado
    bitacora.etapa("Etapa 1. Firma del consentimiento (ECDSA P-256 sobre SHA-256)");
    const consentimiento = {
        id_obra: id_obra,
        nombre_pintor: nombre_pintor,
        titulo_obra: titulo_obra,
        declaracion: DECLARACION_CONSENTIMIENTO,
        fecha: new Date().toISOString(),
    };
    const documento_texto = JSON.stringify(consentimiento);
    const documento_bytes = cripto.texto_a_bytes(documento_texto);
    bitacora.dato("Documento de consentimiento", documento_texto);
    bitacora.dato("h = SHA-256(documento)", await cripto.sha256(documento_bytes));

    const firma = await cripto.firmar_documento(estado_pintor.llaves_firma.privada, documento_bytes);
    bitacora.ok("Firma (r || s) con la llave privada del pintor", firma);

    // Etapa 2: cifrado de la obra
    bitacora.etapa("Etapa 2. Cifrado de la obra (AES-256-GCM)");
    bitacora.dato(`K_AES (${obtener_modo_llave_aes()})`, llave_sesion);

    const resultado_aes = await cripto.cifrar_aes_gcm(llave_sesion, estado_pintor.bytes_pintura);
    bitacora.dato("IV aleatorio de 96 bits", resultado_aes.iv);
    bitacora.dato("Pintura en claro", `${formatear_bytes(estado_pintor.bytes_pintura.length)} bytes`);
    bitacora.dato("Pintura cifrada (incluye etiqueta GCM)", `${formatear_bytes(resultado_aes.cifrado.length)} bytes`);
    bitacora.ok("Etiqueta de autenticacion GCM", resultado_aes.cifrado.slice(-cripto.LONGITUD_ETIQUETA_GCM));

    // Etapa 3: un sobre de llave por juez
    bitacora.etapa("Etapa 3. Sobres de llave CK = RSA-OAEP(PK_juez, K_AES)");
    const respuesta_jurado = await api.obtener_jurado();
    if (!respuesta_jurado.ok)
    {
        mostrar_mensaje("mensaje_pintor", respuesta_jurado.error, "error");
        return;
    }

    const etiqueta_oaep = cripto.construir_etiqueta_oaep(id_obra);
    bitacora.dato("Etiqueta OAEP (amarra el sobre a esta obra)", new TextDecoder().decode(etiqueta_oaep));

    const sobres = {};
    for (const id_juez of jueces_destino)
    {
        const publica_hex = respuesta_jurado.datos[id_juez];
        if (!publica_hex)
        {
            bitacora.falla(`${id_juez} ya no tiene llave publica en el servidor; se omite`);
            continue;
        }

        const llave_publica = llave_publica_desde_hex(publica_hex);
        bitacora.dato(`Sobre para ${id_juez}`, `n de ${llave_publica.n.toString(2).length} bits, huella ${await cripto.huella_llave(llave_publica)}`);

        const sobre = await cifrar_oaep(llave_sesion, llave_publica, etiqueta_oaep, bitacora.dato);
        if (sobre === null)
        {
            bitacora.falla(`No se pudo crear el sobre para ${id_juez}`);
            continue;
        }
        bitacora.ok(`CK para ${id_juez} = EM^e mod n`, sobre);
        sobres[id_juez] = cripto.bytes_a_base64(sobre);
    }

    if (Object.keys(sobres).length === 0)
    {
        mostrar_mensaje("mensaje_pintor", "No se genero ningun sobre de llave; la obra no se envio.", "error");
        return;
    }

    // Envio: solo viajan datos firmados o cifrados
    bitacora.etapa("Envio al servidor central");
    const registro = {
        id_obra: id_obra,
        consentimiento: documento_texto,
        firma_consentimiento: cripto.bytes_a_base64(firma),
        llave_publica_pintor: estado_pintor.llaves_firma.publica_jwk,
        pintura_cifrada: cripto.bytes_a_base64(resultado_aes.cifrado),
        iv: cripto.bytes_a_base64(resultado_aes.iv),
        tipo_mime: estado_pintor.tipo_mime,
        sobres: sobres,
    };

    const respuesta = await api.enviar_obra(registro);
    if (!respuesta.ok)
    {
        bitacora.falla("El servidor rechazo la obra", respuesta.error);
        mostrar_mensaje("mensaje_pintor", respuesta.error, "error");
        return;
    }

    bitacora.ok("Respuesta del servidor", respuesta.datos.mensaje);
    bitacora.dato("K_AES se borra de este dispositivo; solo los jueces pueden recuperarla abriendo su sobre");
    mostrar_mensaje("mensaje_pintor", `Obra ${id_obra} enviada con ${Object.keys(sobres).length} sobre(s) de llave.`, "exito");
    await actualizar_todo();
}

// Dispositivo del jurado

function inicializar_jurado()
{
    cargar_llaves_jurado_guardadas();

    obtener("juez_activo").addEventListener("change", async function ()
    {
        crear_bitacora("bitacora_jurado").limpiar();
        ocultar_obra_descifrada();
        mostrar_mensaje("mensaje_jurado", "");
        await mostrar_estado_llave();
        await actualizar_todo();
    });

    obtener("boton_generar_llaves").addEventListener("click", generar_llaves_juez);
    obtener("archivo_llave_privada").addEventListener("change", importar_llave_juez);
    obtener("boton_descargar_llave").addEventListener("click", descargar_llave_juez);
    obtener("boton_publicar_llave").addEventListener("click", async function ()
    {
        const bitacora = crear_bitacora("bitacora_jurado");
        bitacora.limpiar();
        await publicar_llave_juez(bitacora);
    });
}

function juez_activo()
{
    return obtener("juez_activo").value;
}

function cargar_llaves_jurado_guardadas()
{
    // Las llaves privadas viven en el almacenamiento local del navegador (el "dispositivo" del juez)
    let guardadas = {};
    try
    {
        guardadas = JSON.parse(localStorage.getItem(CLAVE_ALMACEN_JURADO) || "{}");
    }
    catch (error)
    {
        guardadas = {};
    }

    for (const id_juez of Object.keys(guardadas))
    {
        const llave = cripto.llave_desde_json_hex(guardadas[id_juez]);
        if (llave !== null)
        {
            llaves_jurado[id_juez] = llave;
        }
    }
}

function guardar_llaves_jurado()
{
    const llaves_hex = {};
    for (const id_juez of Object.keys(llaves_jurado))
    {
        llaves_hex[id_juez] = cripto.llave_a_json_hex(llaves_jurado[id_juez]);
    }
    try
    {
        localStorage.setItem(CLAVE_ALMACEN_JURADO, JSON.stringify(llaves_hex));
    }
    catch (error)
    {
        mostrar_mensaje("mensaje_jurado", "El navegador no permitio guardar la llave; descargala para no perderla.", "error");
    }
}

async function mostrar_estado_llave()
{
    const lista_estado = obtener("estado_llave_juez");
    lista_estado.replaceChildren();
    const llave = llaves_jurado[juez_activo()];

    function agregar_fila(nombre, valor)
    {
        lista_estado.appendChild(crear_elemento("dt", "", nombre));
        lista_estado.appendChild(crear_elemento("dd", "", valor));
    }

    obtener("boton_descargar_llave").disabled = !llave;
    obtener("boton_publicar_llave").disabled = !llave;

    if (!llave)
    {
        agregar_fila("Estado", "Sin llave en este dispositivo");
        return;
    }

    agregar_fila("Modulo n", `${llave.n.toString(2).length} bits`);
    agregar_fila("Exponente e", llave.e.toString());
    agregar_fila("Huella", await cripto.huella_llave(llave));
    agregar_fila("Llave privada d", "Guardada solo en este navegador");
}

async function generar_llaves_juez()
{
    const id_juez = juez_activo();
    const boton = obtener("boton_generar_llaves");
    const bitacora = crear_bitacora("bitacora_jurado");
    bitacora.limpiar();

    if (llaves_jurado[id_juez] && !confirm(`${id_juez} ya tiene una llave. Si la reemplazas, no podra abrir las obras enviadas con la anterior. Continuar?`))
    {
        return;
    }

    boton.disabled = true;
    mostrar_mensaje("mensaje_jurado", "Generando primos de 1024 bits...");

    const inicio = performance.now();
    const llave = await cripto.generar_llaves_rsa();
    const duracion = performance.now() - inicio;

    bitacora.etapa(`Par de llaves RSA-2048 para ${id_juez}`);
    bitacora.dato("p (primo de 1024 bits)", hex_a_bytes(llave.p.toString(16)));
    bitacora.dato("q (primo de 1024 bits)", hex_a_bytes(llave.q.toString(16)));
    bitacora.dato("n = p * q", hex_a_bytes(llave.n.toString(16)));
    bitacora.dato("e", llave.e.toString());
    bitacora.dato("d = e^-1 mod phi(n) (no sale del dispositivo)", hex_a_bytes(llave.d.toString(16)));
    bitacora.dato("Tiempo de generacion", `${duracion.toFixed(0)} ms`);

    llaves_jurado[id_juez] = llave;
    guardar_llaves_jurado();
    boton.disabled = false;
    await publicar_llave_juez(bitacora);
}

async function importar_llave_juez(evento)
{
    const archivo = evento.target.files[0];
    evento.target.value = "";
    if (!archivo)
    {
        return;
    }

    let contenido;
    try
    {
        contenido = JSON.parse(await archivo.text());
    }
    catch (error)
    {
        mostrar_mensaje("mensaje_jurado", "El archivo no es un JSON valido.", "error");
        return;
    }

    const llave = cripto.llave_desde_json_hex(contenido);
    if (llave === null)
    {
        mostrar_mensaje("mensaje_jurado", "El archivo no es una llave privada RSA valida: necesita n, e y d en hexadecimal.", "error");
        return;
    }

    const id_juez = juez_activo();
    const bitacora = crear_bitacora("bitacora_jurado");
    bitacora.limpiar();
    bitacora.etapa(`Llave privada importada para ${id_juez}`);
    bitacora.dato("Archivo", archivo.name);
    bitacora.dato("n", hex_a_bytes(llave.n.toString(16)));
    bitacora.ok("Comprobacion (2^e)^d mod n = 2", "e y d son inversos");

    llaves_jurado[id_juez] = llave;
    guardar_llaves_jurado();
    await publicar_llave_juez(bitacora);
}

function descargar_llave_juez()
{
    const id_juez = juez_activo();
    const llave = llaves_jurado[id_juez];
    if (!llave)
    {
        return;
    }

    // Mismo formato que rsa_llaves.py, para poder usarla tambien desde Python
    const contenido = JSON.stringify(cripto.llave_a_json_hex(llave), null, 4);
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(new Blob([contenido], { type: "application/json" }));
    enlace.download = `${id_juez}_privada.json`;
    enlace.click();
    setTimeout(function ()
    {
        URL.revokeObjectURL(enlace.href);
    }, 1000);
}

async function publicar_llave_juez(bitacora)
{
    const id_juez = juez_activo();
    const llave = llaves_jurado[id_juez];
    if (!llave)
    {
        return;
    }

    const publica_hex = cripto.llave_a_json_hex(cripto.parte_publica(llave));
    const respuesta = await api.publicar_llave_jurado(id_juez, publica_hex);
    if (!respuesta.ok)
    {
        bitacora.falla("El servidor rechazo la llave", respuesta.error);
        mostrar_mensaje("mensaje_jurado", respuesta.error, "error");
        return;
    }

    bitacora.etapa("Publicacion en el servidor");
    bitacora.ok("Se envio solo la llave publica (n, e)", respuesta.datos.mensaje);
    mostrar_mensaje("mensaje_jurado", `Llave publica de ${id_juez} disponible para los pintores.`, "exito");
    await mostrar_estado_llave();
    await actualizar_todo();
}

function mostrar_obras_juez(obras)
{
    const lista = obtener("lista_obras_juez");
    lista.replaceChildren();
    const id_juez = juez_activo();
    let cantidad = 0;

    for (const obra of obras)
    {
        if (!obra.jueces.includes(id_juez))
        {
            continue;
        }
        cantidad++;

        const elemento = crear_elemento("li");
        elemento.appendChild(crear_elemento("span", "", `Obra ${obra.id_obra} (${formatear_bytes(obra.bytes_cifrados)} bytes cifrados)`));

        const botones = crear_elemento("span", "acciones_tabla");
        const boton_abrir = crear_elemento("button", "boton_secundario", "Abrir obra");
        boton_abrir.type = "button";
        boton_abrir.addEventListener("click", function ()
        {
            abrir_obra(obra.id_obra, false);
        });

        const boton_alterada = crear_elemento("button", "boton_secundario", "Abrir con un bit alterado");
        boton_alterada.type = "button";
        boton_alterada.addEventListener("click", function ()
        {
            abrir_obra(obra.id_obra, true);
        });

        botones.appendChild(boton_abrir);
        botones.appendChild(boton_alterada);
        elemento.appendChild(botones);
        lista.appendChild(elemento);
    }

    if (cantidad === 0)
    {
        lista.appendChild(crear_elemento("li", "vacio", `No hay obras con sobre de llave para ${id_juez}.`));
    }
}

function ocultar_obra_descifrada()
{
    obtener("figura_obra_descifrada").hidden = true;
    if (url_obra_descifrada)
    {
        URL.revokeObjectURL(url_obra_descifrada);
        url_obra_descifrada = null;
    }
}

async function abrir_obra(id_obra, alterar_bit)
{
    const id_juez = juez_activo();
    const llave_privada = llaves_jurado[id_juez];
    const bitacora = crear_bitacora("bitacora_jurado");
    bitacora.limpiar();
    ocultar_obra_descifrada();

    if (!llave_privada)
    {
        mostrar_mensaje("mensaje_jurado", `Este dispositivo no tiene la llave privada de ${id_juez}. Generala o importala.`, "error");
        return;
    }

    bitacora.etapa(`Descarga de la obra ${id_obra} para ${id_juez}`);
    const respuesta = await api.obtener_obra(id_obra, id_juez);
    if (!respuesta.ok)
    {
        mostrar_mensaje("mensaje_jurado", respuesta.error, "error");
        return;
    }

    const sobre = cripto.base64_a_bytes(respuesta.datos.sobre);
    const pintura_cifrada = cripto.base64_a_bytes(respuesta.datos.pintura_cifrada);
    const iv = cripto.base64_a_bytes(respuesta.datos.iv);
    bitacora.dato("Sobre CK recibido", sobre);
    bitacora.dato("Pintura cifrada recibida", `${formatear_bytes(pintura_cifrada.length)} bytes`);

    // Etapa 3 inversa: abrir el sobre con la llave privada
    bitacora.etapa("Apertura del sobre: K_AES = RSA-OAEP^-1(SK_juez, CK)");
    const etiqueta_oaep = cripto.construir_etiqueta_oaep(id_obra);
    const llave_sesion = await descifrar_oaep(sobre, llave_privada, etiqueta_oaep, bitacora.dato);
    if (llave_sesion === null)
    {
        bitacora.falla("El sobre no se pudo abrir: la llave privada no corresponde o el sobre fue alterado");
        mostrar_mensaje("mensaje_jurado", "No se pudo abrir el sobre de llave.", "error");
        return;
    }
    bitacora.ok("K_AES recuperada con nuestro RSA-OAEP", llave_sesion);

    if (llave_privada.p === undefined)
    {
        bitacora.dato("Comprobacion con Web Crypto omitida: la llave importada no incluye p y q");
    }
    else
    {
        const llave_comprobacion = await cripto.descifrar_con_webcrypto(sobre, llave_privada, etiqueta_oaep);
        if (llave_comprobacion !== null && bytes_a_hex(llave_comprobacion) === bytes_a_hex(llave_sesion))
        {
            bitacora.ok("Web Crypto del navegador obtiene la misma K_AES", "Implementacion compatible con RFC 8017");
        }
        else
        {
            bitacora.falla("Web Crypto obtuvo un resultado distinto");
        }
    }

    if (alterar_bit)
    {
        const posicion = Math.floor(pintura_cifrada.length / 2);
        pintura_cifrada[posicion] ^= 1;
        bitacora.falla("Simulacion de ataque", `Se invirtio un bit en el byte ${formatear_bytes(posicion)} de la pintura cifrada`);
    }

    // Etapa 2 inversa: descifrar la obra
    bitacora.etapa("Descifrado de la obra con AES-256-GCM");
    const pintura_clara = await cripto.descifrar_aes_gcm(llave_sesion, iv, pintura_cifrada);
    llave_sesion.fill(0);

    if (pintura_clara === null)
    {
        bitacora.falla("La etiqueta GCM no coincide: la obra fue modificada y se rechaza");
        mostrar_mensaje("mensaje_jurado", "La obra fue modificada en el camino; GCM rechazo el descifrado.", "error");
        return;
    }
    bitacora.ok("Etiqueta GCM valida: la obra no fue modificada", `${formatear_bytes(pintura_clara.length)} bytes en claro`);

    url_obra_descifrada = URL.createObjectURL(new Blob([pintura_clara], { type: respuesta.datos.tipo_mime }));
    obtener("imagen_obra_descifrada").src = url_obra_descifrada;
    obtener("pie_obra_descifrada").textContent = `Obra ${id_obra} descifrada en el dispositivo de ${id_juez}`;
    obtener("figura_obra_descifrada").hidden = false;
    mostrar_mensaje("mensaje_jurado", `Obra ${id_obra} lista para evaluar.`, "exito");
}

// Servidor central

function inicializar_servidor()
{
    obtener("boton_actualizar").addEventListener("click", actualizar_todo);
    obtener("boton_reiniciar").addEventListener("click", async function ()
    {
        if (!confirm("Se borraran las obras y las llaves publicas del servidor. Continuar?"))
        {
            return;
        }
        await api.reiniciar_servidor();
        limpiar_lienzo_servidor();
        mostrar_mensaje("mensaje_jurado", "Servidor reiniciado. Las llaves privadas siguen en este navegador: vuelve a publicarlas.");
        await actualizar_todo();
    });
}

async function mostrar_llaves_servidor(jurado)
{
    const cuerpo_tabla = obtener("tabla_llaves_servidor");
    cuerpo_tabla.replaceChildren();
    const ids_jueces = Object.keys(jurado).sort();

    if (ids_jueces.length === 0)
    {
        const fila = crear_elemento("tr");
        const celda = crear_elemento("td", "vacio", "Sin llaves registradas");
        celda.colSpan = 3;
        fila.appendChild(celda);
        cuerpo_tabla.appendChild(fila);
        return;
    }

    for (const id_juez of ids_jueces)
    {
        const llave_publica = llave_publica_desde_hex(jurado[id_juez]);
        const fila = crear_elemento("tr");
        fila.appendChild(crear_elemento("td", "", id_juez));
        fila.appendChild(crear_elemento("td", "numero", String(llave_publica.n.toString(2).length)));
        fila.appendChild(crear_elemento("td", "dato", await cripto.huella_llave(llave_publica)));
        cuerpo_tabla.appendChild(fila);
    }
}

function mostrar_obras_servidor(obras)
{
    const cuerpo_tabla = obtener("tabla_obras_servidor");
    cuerpo_tabla.replaceChildren();

    if (obras.length === 0)
    {
        const fila = crear_elemento("tr");
        const celda = crear_elemento("td", "vacio", "Sin obras almacenadas");
        celda.colSpan = 4;
        fila.appendChild(celda);
        cuerpo_tabla.appendChild(fila);
        return;
    }

    for (const obra of obras)
    {
        const fila = crear_elemento("tr");
        fila.tabIndex = 0;
        fila.appendChild(crear_elemento("td", "dato", obra.id_obra));
        fila.appendChild(crear_elemento("td", "", obra.fecha_recepcion));
        fila.appendChild(crear_elemento("td", "numero", formatear_bytes(obra.bytes_cifrados)));
        fila.appendChild(crear_elemento("td", "", obra.jueces.join(", ")));

        fila.addEventListener("click", function ()
        {
            dibujar_obra_servidor(obra.id_obra, fila);
        });
        fila.addEventListener("keydown", function (evento)
        {
            if (evento.key === "Enter" || evento.key === " ")
            {
                evento.preventDefault();
                dibujar_obra_servidor(obra.id_obra, fila);
            }
        });
        cuerpo_tabla.appendChild(fila);
    }
}

function limpiar_lienzo_servidor()
{
    const lienzo = obtener("lienzo_servidor");
    lienzo.getContext("2d").clearRect(0, 0, lienzo.width, lienzo.height);
    obtener("pie_lienzo_servidor").textContent = "Los bytes cifrados de una obra se dibujan aqui como pixeles.";
}

async function dibujar_obra_servidor(id_obra, fila_seleccionada)
{
    for (const fila of obtener("tabla_obras_servidor").querySelectorAll("tr"))
    {
        fila.classList.remove("seleccionada");
    }
    fila_seleccionada.classList.add("seleccionada");

    const respuesta = await api.obtener_obra(id_obra);
    if (!respuesta.ok)
    {
        obtener("pie_lienzo_servidor").textContent = respuesta.error;
        return;
    }

    // Cada 3 bytes cifrados se vuelven un pixel RGB: sin K_AES solo hay ruido
    const bytes_cifrados = cripto.base64_a_bytes(respuesta.datos.pintura_cifrada);
    const lado = Math.max(1, Math.min(LADO_MAXIMO_LIENZO, Math.floor(Math.sqrt(bytes_cifrados.length / 3))));
    const lienzo = obtener("lienzo_servidor");
    lienzo.width = lado;
    lienzo.height = lado;

    const contexto = lienzo.getContext("2d");
    const imagen = contexto.createImageData(lado, lado);
    for (let pixel = 0; pixel < lado * lado; pixel++)
    {
        imagen.data[pixel * 4] = bytes_cifrados[pixel * 3];
        imagen.data[pixel * 4 + 1] = bytes_cifrados[pixel * 3 + 1];
        imagen.data[pixel * 4 + 2] = bytes_cifrados[pixel * 3 + 2];
        imagen.data[pixel * 4 + 3] = 255;
    }
    contexto.putImageData(imagen, 0, 0);

    const cantidad_sobres = Object.keys(respuesta.datos.sobres).length;
    obtener("pie_lienzo_servidor").textContent =
        `Obra ${id_obra}: ${formatear_bytes(lado * lado * 3)} de ${formatear_bytes(bytes_cifrados.length)} bytes cifrados, ` +
        `mas ${cantidad_sobres} sobre(s) que el servidor no puede abrir.`;
}

// Zona de verificacion publica

async function mostrar_consentimientos(consentimientos)
{
    const cuerpo_tabla = obtener("tabla_consentimientos");
    cuerpo_tabla.replaceChildren();

    if (consentimientos.length === 0)
    {
        const fila = crear_elemento("tr");
        const celda = crear_elemento("td", "vacio", "Aun no hay consentimientos publicados");
        celda.colSpan = 5;
        fila.appendChild(celda);
        cuerpo_tabla.appendChild(fila);
        return;
    }

    for (const registro of consentimientos)
    {
        const documento = JSON.parse(registro.consentimiento);
        const hash_documento = await cripto.sha256(cripto.texto_a_bytes(registro.consentimiento));

        const fila = crear_elemento("tr");
        fila.appendChild(crear_elemento("td", "dato", registro.id_obra));
        fila.appendChild(crear_elemento("td", "", documento.titulo_obra));
        fila.appendChild(crear_elemento("td", "", documento.nombre_pintor));
        fila.appendChild(crear_elemento("td", "dato", bytes_a_hex(hash_documento).substring(0, 24) + "..."));

        const celda_acciones = crear_elemento("td");
        const acciones = crear_elemento("div", "acciones_tabla");
        const resultado = crear_elemento("span", "resultado_verificacion");

        const boton_verificar = crear_elemento("button", "boton_secundario", "Verificar firma");
        boton_verificar.type = "button";
        boton_verificar.addEventListener("click", function ()
        {
            verificar_consentimiento(registro, false, resultado);
        });

        const boton_alterado = crear_elemento("button", "boton_secundario", "Verificar con nombre cambiado");
        boton_alterado.type = "button";
        boton_alterado.addEventListener("click", function ()
        {
            verificar_consentimiento(registro, true, resultado);
        });

        acciones.appendChild(boton_verificar);
        acciones.appendChild(boton_alterado);
        acciones.appendChild(resultado);
        celda_acciones.appendChild(acciones);
        fila.appendChild(celda_acciones);
        cuerpo_tabla.appendChild(fila);
    }
}

async function verificar_consentimiento(registro, alterar_documento, elemento_resultado)
{
    let documento_texto = registro.consentimiento;
    if (alterar_documento)
    {
        const documento = JSON.parse(documento_texto);
        documento.nombre_pintor = "Otra persona";
        documento_texto = JSON.stringify(documento);
    }

    const firma = cripto.base64_a_bytes(registro.firma_consentimiento);
    const es_valida = await cripto.verificar_firma(registro.llave_publica_pintor, cripto.texto_a_bytes(documento_texto), firma);

    elemento_resultado.className = "resultado_verificacion";
    if (es_valida)
    {
        elemento_resultado.textContent = "Firma valida";
        elemento_resultado.classList.add("exito");
    }
    else if (alterar_documento)
    {
        elemento_resultado.textContent = "Firma invalida: el documento fue modificado";
        elemento_resultado.classList.add("error");
    }
    else
    {
        elemento_resultado.textContent = "Firma invalida";
        elemento_resultado.classList.add("error");
    }
}

// Sincronizacion general

async function actualizar_todo()
{
    const respuestas = await Promise.all([
        api.obtener_jurado(),
        api.listar_obras(),
        api.listar_consentimientos(),
    ]);
    const respuesta_jurado = respuestas[0];
    const respuesta_obras = respuestas[1];
    const respuesta_consentimientos = respuestas[2];

    if (!respuesta_jurado.ok || !respuesta_obras.ok || !respuesta_consentimientos.ok)
    {
        mostrar_mensaje("mensaje_pintor", "No hay conexion con el servidor. Ejecuta: python3 servidor.py", "error");
        return;
    }

    mostrar_jueces_destino(respuesta_jurado.datos);
    mostrar_obras_servidor(respuesta_obras.datos);
    mostrar_obras_juez(respuesta_obras.datos);
    await mostrar_llaves_servidor(respuesta_jurado.datos);
    await mostrar_consentimientos(respuesta_consentimientos.datos);
}

async function iniciar()
{
    estado_pintor.llaves_firma = await cripto.generar_llaves_firma();
    inicializar_pintor();
    inicializar_jurado();
    inicializar_servidor();
    await mostrar_estado_llave();
    await actualizar_todo();
}

iniciar();
