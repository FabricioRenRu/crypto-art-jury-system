"""
app/services/key_vault.py
Boveda en RAM de las llaves privadas ECDSA de los pintores con sesion activa.

Equivale al "estado_sesion" que antes vivia en el worker de Pyodide (session_utils.py):
el pintor sube su .pem despues de iniciar sesion (POST /api/auth/pintores/llave); se
valida contra su publica registrada, se guarda aqui solo mientras dura el JWT y nunca se
escribe en disco ni en la BD. Si el servidor se reinicia la boveda se vacia
(igual que el F5 en el navegador) y el pintor debe volver a iniciar sesion.

LIMITACION: es memoria de un solo proceso. Con varios workers de uvicorn habria que
usar una boveda compartida (p. ej. Redis con cifrado) o fijar la sesion a un worker.
"""
import threading
import time
from typing import Optional


class KeyVault:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._llaves: dict[str, tuple[str, float]] = {}

    def guardar(self, jti: str, privada_pem: str, expira_ts: float) -> None:
        with self._lock:
            self._purgar_locked()
            self._llaves[jti] = (privada_pem, expira_ts)

    def obtener(self, jti: str) -> Optional[str]:
        with self._lock:
            entrada = self._llaves.get(jti)
            if entrada is None:
                return None
            privada_pem, expira_ts = entrada
            if expira_ts <= time.time():
                del self._llaves[jti]
                return None
            return privada_pem

    def eliminar(self, jti: str) -> None:
        with self._lock:
            self._llaves.pop(jti, None)

    def _purgar_locked(self) -> None:
        ahora = time.time()
        for jti in [k for k, (_, exp) in self._llaves.items() if exp <= ahora]:
            del self._llaves[jti]


boveda_pintores: KeyVault = KeyVault()
