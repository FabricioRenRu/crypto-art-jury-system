from fastapi import FastAPI
import logging
import app.exceptions.exception_handlers as exception_handlers
from app.routes import pintores, pinturas, jurado, evaluaciones, presidente, resultados

# Configuracion del logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),          # Imprime en la consola
        logging.FileHandler("app.log")     # Guarda los logs en un archivo
    ]
)

# Instancia logger global
logger: logging.Logger = logging.getLogger(name="backend")

# Configuracion de la App
app: FastAPI = FastAPI(
    title="API concurso pintura",
    version="1.0"
)


# === Registrar Rutas === #
app.include_router(pintores.router)
app.include_router(pinturas.router)
app.include_router(jurado.router)
app.include_router(evaluaciones.router)
app.include_router(presidente.router)
app.include_router(resultados.router)

# === Registrar Exception Handlers === #
app.add_exception_handler(
    Exception,
    exception_handlers.global_exception_handler
)


@app.get("/")
def root():
    return "Server running at port 8000"



