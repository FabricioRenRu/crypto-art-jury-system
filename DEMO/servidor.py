import base64
import json
import os
import re
import secrets
from datetime import datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PUERTO = 8000
CARPETA_BASE = os.path.dirname(os.path.abspath(__file__))
CARPETA_WEB = os.path.join(CARPETA_BASE, "web")
CARPETA_DATOS = os.path.join(CARPETA_BASE, "datos")
CARPETA_OBRAS = os.path.join(CARPETA_DATOS, "obras")
ARCHIVO_JURADO = os.path.join(CARPETA_DATOS, "jurado.json")
TAMANO_MAXIMO_PETICION = 25 * 1024 * 1024
PATRON_ID_OBRA = re.compile(r"^[0-9a-f]{6}$")
PATRON_ID_JUEZ = re.compile(r"^juez_[0-9]+$")
PATRON_HEX = re.compile(r"^[0-9a-f]+$")


def leer_json(ruta_archivo, valor_por_defecto):
    if not os.path.exists(ruta_archivo):
        return valor_por_defecto
    with open(ruta_archivo, "r") as archivo:
        return json.load(archivo)


def escribir_json(ruta_archivo, datos):
    with open(ruta_archivo, "w") as archivo:
        json.dump(datos, archivo, indent=4)


def ruta_obra(id_obra):
    return os.path.join(CARPETA_OBRAS, f"{id_obra}.json")


def es_base64_valido(texto):
    try:
        base64.b64decode(texto, validate=True)
    except (ValueError, TypeError):
        return False
    return True


class ManejadorConcurso(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=CARPETA_WEB, **kwargs)

    def log_request(self, codigo="-", tamano="-"):
        ruta = urlparse(self.path).path
        print(f"    {self.command:<8}{ruta:<40}{str(codigo):>6}")

    def responder_json(self, codigo, datos):
        cuerpo = json.dumps(datos).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def leer_cuerpo(self):
        longitud = int(self.headers.get("Content-Length", 0))
        if longitud > TAMANO_MAXIMO_PETICION:
            return None
        try:
            return json.loads(self.rfile.read(longitud) or b"{}")
        except json.JSONDecodeError:
            return None

    def do_GET(self):
        url = urlparse(self.path)
        partes = url.path.strip("/").split("/")

        if url.path == "/api/jurado":
            self.responder_json(200, leer_json(ARCHIVO_JURADO, {}))
            return

        if url.path == "/api/obras":
            self.listar_obras()
            return

        if url.path == "/api/consentimientos":
            self.listar_consentimientos()
            return

        if len(partes) == 3 and partes[0] == "api" and partes[1] == "obras":
            parametros = parse_qs(url.query)
            id_juez = None
            if "juez" in parametros:
                id_juez = parametros["juez"][0]
            self.obtener_obra(partes[2], id_juez)
            return

        super().do_GET()

    def do_POST(self):
        ruta = urlparse(self.path).path

        if ruta == "/api/obras/reservar":
            self.reservar_obra()
            return

        if ruta == "/api/reiniciar":
            self.reiniciar_datos()
            return

        cuerpo = self.leer_cuerpo()
        if cuerpo is None:
            self.responder_json(400, {"error": "Cuerpo de la peticion invalido o demasiado grande"})
            return

        if ruta == "/api/jurado":
            self.registrar_llave_jurado(cuerpo)
            return

        if ruta == "/api/obras":
            self.guardar_obra(cuerpo)
            return

        self.responder_json(404, {"error": "Ruta no encontrada"})

    def registrar_llave_jurado(self, cuerpo):
        # El servidor solo recibe (n, e): la llave privada nunca sale del dispositivo del juez
        id_juez = cuerpo.get("id_juez", "")
        llave_publica = cuerpo.get("llave_publica", {})
        modulo_hex = llave_publica.get("n", "")
        exponente_hex = llave_publica.get("e", "")

        if not PATRON_ID_JUEZ.match(id_juez):
            self.responder_json(400, {"error": "Identificador de juez invalido"})
            return
        if not PATRON_HEX.match(modulo_hex) or not PATRON_HEX.match(exponente_hex):
            self.responder_json(400, {"error": "La llave publica debe tener n y e en hexadecimal"})
            return
        if "d" in llave_publica:
            self.responder_json(400, {"error": "Se recibio una llave privada; el servidor solo acepta (n, e)"})
            return

        jurado = leer_json(ARCHIVO_JURADO, {})
        jurado[id_juez] = {"n": modulo_hex, "e": exponente_hex}
        escribir_json(ARCHIVO_JURADO, jurado)
        self.responder_json(200, {"mensaje": f"Llave publica de {id_juez} registrada"})

    def reservar_obra(self):
        # El id se necesita antes de cifrar porque forma parte de la etiqueta OAEP
        id_obra = secrets.token_hex(3)
        while os.path.exists(ruta_obra(id_obra)):
            id_obra = secrets.token_hex(3)
        self.responder_json(200, {"id_obra": id_obra})

    def guardar_obra(self, cuerpo):
        campos_requeridos = [
            "id_obra",
            "consentimiento",
            "firma_consentimiento",
            "llave_publica_pintor",
            "pintura_cifrada",
            "iv",
            "tipo_mime",
            "sobres",
        ]
        for campo in campos_requeridos:
            if campo not in cuerpo:
                self.responder_json(400, {"error": f"Falta el campo {campo}"})
                return

        id_obra = cuerpo["id_obra"]
        if not PATRON_ID_OBRA.match(id_obra) or os.path.exists(ruta_obra(id_obra)):
            self.responder_json(400, {"error": "Identificador de obra invalido o ya usado"})
            return

        if not es_base64_valido(cuerpo["pintura_cifrada"]) or len(cuerpo["sobres"]) == 0:
            self.responder_json(400, {"error": "Pintura cifrada o sobres de llave invalidos"})
            return

        registro = dict(cuerpo)
        registro["fecha_recepcion"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        registro["bytes_cifrados"] = len(base64.b64decode(cuerpo["pintura_cifrada"]))
        escribir_json(ruta_obra(id_obra), registro)
        self.responder_json(200, {"mensaje": f"Obra {id_obra} almacenada", "id_obra": id_obra})

    def listar_obras(self):
        obras = []
        for nombre_archivo in sorted(os.listdir(CARPETA_OBRAS)):
            registro = leer_json(os.path.join(CARPETA_OBRAS, nombre_archivo), None)
            if registro is None:
                continue
            obras.append({
                "id_obra": registro["id_obra"],
                "fecha_recepcion": registro["fecha_recepcion"],
                "bytes_cifrados": registro["bytes_cifrados"],
                "jueces": sorted(registro["sobres"].keys()),
            })
        obras.sort(key=lambda obra: obra["fecha_recepcion"])
        self.responder_json(200, obras)

    def obtener_obra(self, id_obra, id_juez):
        if not PATRON_ID_OBRA.match(id_obra) or not os.path.exists(ruta_obra(id_obra)):
            self.responder_json(404, {"error": "Obra no encontrada"})
            return

        registro = leer_json(ruta_obra(id_obra), {})
        respuesta = {
            "id_obra": registro["id_obra"],
            "pintura_cifrada": registro["pintura_cifrada"],
            "iv": registro["iv"],
            "tipo_mime": registro["tipo_mime"],
        }

        # Cada juez solo descarga su propio sobre de llave
        if id_juez is None:
            respuesta["sobres"] = registro["sobres"]
        else:
            if id_juez not in registro["sobres"]:
                self.responder_json(403, {"error": f"La obra no tiene sobre de llave para {id_juez}"})
                return
            respuesta["sobre"] = registro["sobres"][id_juez]

        self.responder_json(200, respuesta)

    def listar_consentimientos(self):
        consentimientos = []
        for nombre_archivo in sorted(os.listdir(CARPETA_OBRAS)):
            registro = leer_json(os.path.join(CARPETA_OBRAS, nombre_archivo), None)
            if registro is None:
                continue
            consentimientos.append({
                "id_obra": registro["id_obra"],
                "consentimiento": registro["consentimiento"],
                "firma_consentimiento": registro["firma_consentimiento"],
                "llave_publica_pintor": registro["llave_publica_pintor"],
            })
        self.responder_json(200, consentimientos)

    def reiniciar_datos(self):
        for nombre_archivo in os.listdir(CARPETA_OBRAS):
            os.remove(os.path.join(CARPETA_OBRAS, nombre_archivo))
        if os.path.exists(ARCHIVO_JURADO):
            os.remove(ARCHIVO_JURADO)
        self.responder_json(200, {"mensaje": "Datos del servidor eliminados"})


def main():
    os.makedirs(CARPETA_OBRAS, exist_ok=True)
    servidor = ThreadingHTTPServer(("localhost", PUERTO), ManejadorConcurso)

    print(f"{'Servidor del concurso':<25}http://localhost:{PUERTO}")
    print(f"{'Datos almacenados en':<25}{CARPETA_DATOS}\n")
    print(f"    {'Metodo':<8}{'Ruta':<40}{'Codigo':>6}")

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido")


if __name__ == "__main__":
    main()
