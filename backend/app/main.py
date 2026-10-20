from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
import logging
import app.exceptions.exception_handlers as exception_handlers
from app.exceptions.custom_exceptions import *
from app.routes import auth, pinturas, jurado, evaluaciones, presidente, resultados
from fastapi.middleware.cors import CORSMiddleware

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
    title="API Painting Competition",
    version="1.0"
)

# Configuracion CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Registrar Rutas === #
app.include_router(auth.router)
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

app.add_exception_handler(
    RequestValidationError, 
    exception_handlers.validation_exception_handler
)

app.add_exception_handler(
    EmailYaRegistradoException,
    exception_handlers.email_registrado_exception_handler
)

app.add_exception_handler(
    CredencialesInvalidasException,
    exception_handlers.credenciales_invalidas_exception_handler
)


@app.get("/")
def root():
    return "Server running at port 8000"



