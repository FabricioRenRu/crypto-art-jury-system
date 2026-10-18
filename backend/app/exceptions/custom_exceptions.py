class EmailYaRegistradoException(Exception):
    def __init__(self, email: str):
        self.email = email
        super().__init__(f"El correo {email} ya se encuentra registrado.")


class CredencialesInvalidasException(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message