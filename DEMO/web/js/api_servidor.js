async function peticion(metodo, ruta, cuerpo)
{
    const opciones = { method: metodo, headers: {} };
    if (cuerpo !== undefined)
    {
        opciones.headers["Content-Type"] = "application/json";
        opciones.body = JSON.stringify(cuerpo);
    }

    let respuesta;
    try
    {
        respuesta = await fetch(ruta, opciones);
    }
    catch (error)
    {
        return { ok: false, error: "No hay conexion con el servidor. Revisa que servidor.py siga corriendo." };
    }

    const datos = await respuesta.json();
    if (!respuesta.ok)
    {
        return { ok: false, error: datos.error };
    }
    return { ok: true, datos: datos };
}

export function obtener_jurado()
{
    return peticion("GET", "/api/jurado");
}

export function publicar_llave_jurado(id_juez, llave_publica_hex)
{
    return peticion("POST", "/api/jurado", { id_juez: id_juez, llave_publica: llave_publica_hex });
}

export function reservar_obra()
{
    return peticion("POST", "/api/obras/reservar");
}

export function enviar_obra(registro)
{
    return peticion("POST", "/api/obras", registro);
}

export function listar_obras()
{
    return peticion("GET", "/api/obras");
}

export function obtener_obra(id_obra, id_juez)
{
    let ruta = `/api/obras/${id_obra}`;
    if (id_juez)
    {
        ruta += `?juez=${id_juez}`;
    }
    return peticion("GET", ruta);
}

export function listar_consentimientos()
{
    return peticion("GET", "/api/consentimientos");
}

export function reiniciar_servidor()
{
    return peticion("POST", "/api/reiniciar");
}
