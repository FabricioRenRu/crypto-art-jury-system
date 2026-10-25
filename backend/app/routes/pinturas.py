import uuid

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile
from sqlalchemy.orm import Session

import app.services.pinturas_service as pinturas_service
from app.database.connection import get_db
from app.dependencies.auth_deps import require_pintor
from app.schemas.pintor_schemas import MisObrasResponse, PinturaResponse

router = APIRouter(prefix="/api/pinturas", tags=["Pinturas"])


@router.get("/mis-obras", response_model=MisObrasResponse)
def mis_obras(
    payload: dict = Depends(require_pintor),
    db: Session = Depends(get_db)
):
    """
    Explicación: Lista las obras del pintor autenticado y cuantos slots tiene.
    Espera recibir: JWT de pintor.
    Espera devolver: `total_slots` y la lista `obras` (vacia si aun no subio nada).
    """
    return pinturas_service.listar_mis_obras(db, payload)


@router.post("/cargar", response_model=PinturaResponse, status_code=201)
def cargar_pintura(
    archivo: UploadFile = File(...),
    titulo: str = Form(...),
    descripcion: str = Form(...),
    payload: dict = Depends(require_pintor),
    db: Session = Depends(get_db)
):
    """
    Explicación: Recibe la imagen en claro (por HTTPS), la cifra con AES-256-GCM, genera y firma
    con ECDSA el consentimiento, crea un sobre RSA-OAEP por juez y guarda todo en la BD.
    Espera recibir: multipart/form-data con `archivo`, `titulo` y `descripcion` + JWT de pintor.
    Espera devolver: La obra creada (id, titulo, descripcion, estado, hash y firma del consentimiento).
    """
    # Se lee un byte de mas para detectar archivos que superan el limite sin cargarlos enteros
    contenido: bytes = archivo.file.read(pinturas_service.MAX_BYTES + 1)
    return pinturas_service.cargar_pintura(db, payload, contenido, titulo, descripcion)


@router.get("/{id_pintura}/imagen", response_model=None)
def imagen_de_mi_pintura(
    id_pintura: uuid.UUID,
    payload: dict = Depends(require_pintor),
    db: Session = Depends(get_db)
):
    """
    Explicación: Devuelve descifrada la obra a su propio dueño (para la tarjeta del panel).
    Espera recibir: `id_pintura` en la ruta + JWT de pintor.
    Espera devolver: Los bytes de la imagen con su Content-Type.
    """
    claro, mime = pinturas_service.obtener_imagen_del_dueno(db, payload, id_pintura)
    return Response(content=claro, media_type=mime, headers={"Cache-Control": "private, no-store"})

@router.get("/{id_pintura}/descargar", response_model=None)
def descargar_pintura(id_pintura: uuid.UUID):
    """
    Explicación: Proporciona a un juez el archivo cifrado de la obra y el sobre con la llave simétrica específica para él.
    Espera recibir: El `id_pintura` en la ruta. (En un caso real, también el ID o token del juez autenticado).
    Espera devolver: El archivo binario de la pintura y el `SobreLlave` (la llave AES encriptada con RSA) correspondiente a ese juez.
    """
    pass