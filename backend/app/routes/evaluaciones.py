from fastapi import APIRouter

router = APIRouter(prefix="/api/evaluaciones", tags=["Evaluaciones"])

@router.post("/cegadas", response_model=None)
def subir_evaluacion_cegada():
    """
    Explicación: Guarda el voto oculto del juez en la base de datos (Estado: ESPERANDO_FIRMA), sin revelar estrellas ni comentarios.
    Espera recibir: Un JSON con el `id_juez`, `id_pintura` y el `hash_cegado` (h').
    Espera devolver: Un mensaje de confirmación y el `id_evaluacion` creado.
    """
    pass

@router.get("/mi-firma/{id_pintura}", response_model=None)
def consultar_firma_presidente(id_pintura: int):
    """
    Explicación: Endpoint de polling para que el juez pregunte si el presidente ya autorizó su evaluación cegada.
    Espera recibir: El `id_pintura` en la URL y la identificación del juez.
    Espera devolver: La `firma_ciega_presi` (s') si el estado es FIRMADO, o un mensaje de "Aún pendiente" en caso contrario.
    """
    pass

@router.post("/publicar", response_model=None)
def publicar_evaluacion():
    """
    Explicación: Recibe el voto final en texto claro y la firma descegada del presidente. Cambia el estado a PUBLICADO.
    Espera recibir: Un JSON con el `id_evaluacion` (o pintura/juez), el texto claro (`estrellas`, `comentarios`), el `hash_original`, la `firma_del_juez` y la `firma_descegada` (s).
    Espera devolver: Una confirmación de que el voto fue integrado exitosamente al tablero final.
    """
    pass