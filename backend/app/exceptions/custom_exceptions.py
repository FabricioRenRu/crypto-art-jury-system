class EmailYaRegistradoException(Exception):
    def __init__(self, email: str):
        self.email = email
        super().__init__(f"El correo {email} ya se encuentra registrado.")


class CredencialesInvalidasException(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class AppException(Exception):
    """Base para errores de negocio con status HTTP y codigo propios."""
    status_code: int = 400
    code: str = "ERROR"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class SesionCriptograficaExpiradaException(AppException):
    status_code = 401
    code = "SESION_CRIPTOGRAFICA_EXPIRADA"


class LlaveInvalidaException(AppException):
    status_code = 422
    code = "LLAVE_INVALIDA"


class LlaveNoCorrespondeException(AppException):
    status_code = 403
    code = "LLAVE_NO_CORRESPONDE"


class PinturaYaExistenteException(AppException):
    status_code = 409
    code = "PINTURA_YA_EXISTE"


class ArchivoInvalidoException(AppException):
    status_code = 422
    code = "ARCHIVO_INVALIDO"


class ArchivoDemasiadoGrandeException(AppException):
    status_code = 413
    code = "ARCHIVO_DEMASIADO_GRANDE"


class RecursoNoEncontradoException(AppException):
    status_code = 404
    code = "NO_ENCONTRADO"


class ConfiguracionJuradoIncompletaException(AppException):
    status_code = 503
    code = "JURADO_INCOMPLETO"


class SeudonimoYaRegistradoException(AppException):
    status_code = 409
    code = "SEUDONIMO_DUPLICADO"
