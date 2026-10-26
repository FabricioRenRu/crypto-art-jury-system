# Importamos Base primero
from app.models.base import Base

# Importamos absolutamente TODOS los modelos aquí
from app.models.pintor import Pintor
from app.models.jurado import Jurado
from app.models.pintura import Pintura
from app.models.evaluacion import Evaluacion