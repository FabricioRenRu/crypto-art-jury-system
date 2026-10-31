# server.py
from xmlrpc.server import SimpleXMLRPCServer
import logging


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

class ServidorConcurso:
    def __init__(self):
        self.llave_presidente = None  # { "n": "...", "e": "..." }
        self.hashes_cegados = {}      # dict: id_juez -> hash_cegado (str)
        self.firmas_ciegas = {}       # dict: id_juez -> firma_ciega (str)
        self.evaluaciones_finales = [] # lista de dicts con las evaluaciones descegadas

    # === RUTAS DEL PRESIDENTE ===
    def registrar_llave_presidente(self, n_str: str, e_str: str):
        self.llave_presidente = {"n": n_str, "e": e_str}
        logging.info("Presidente registró su Llave Pública.")
        return True

    def obtener_hashes_pendientes(self):
        return self.hashes_cegados

    def enviar_firmas_ciegas(self, firmas_dict: dict):
        self.firmas_ciegas.update(firmas_dict)
        self.hashes_cegados.clear() # Limpiamos la bandeja
        logging.info(f"Presidente firmó los hashes de: {list(firmas_dict.keys())}")
        return True

    # === RUTAS DE LOS JUECES ===
    def obtener_llave_presidente(self):
        return self.llave_presidente

    def enviar_hash_cegado(self, id_juez: str, hash_cegado_str: str):
        self.hashes_cegados[id_juez] = hash_cegado_str
        logging.info(f"Juez {id_juez} envió un voto cegado.")
        return True

    def obtener_firma_ciega(self, id_juez: str):
        return self.firmas_ciegas.get(id_juez, None)

    def publicar_evaluacion_final(self, id_juez: str, evaluacion_texto: str, firma_final_str: str):
        self.evaluaciones_finales.append({
            "juez": id_juez,
            "evaluacion": evaluacion_texto,
            "firma_verificada": firma_final_str
        })
        logging.info(f"Juez {id_juez} publicó su evaluación verificada.")
        return True

    # === RUTA PÚBLICA ===
    def ver_tablero_publico(self):
        return self.evaluaciones_finales

# Iniciar servidor
if __name__ == "__main__":
    puerto = 8000
    server = SimpleXMLRPCServer(("localhost", puerto), allow_none=True)
    server.register_instance(ServidorConcurso())
    print(f"[*] Servidor Central (Zero Frameworks) iniciado en el puerto {puerto}...")
    server.serve_forever()