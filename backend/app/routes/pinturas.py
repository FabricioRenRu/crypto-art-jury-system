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
    id_pintura: uuid.UUID = Form(...),
    tipo_mime: str = Form(...),
    tamano_original: int = Form(...),
    documento_consentimiento: str = Form(...),
    firma_consentimiento: str = Form(...),
    titulo: str = Form(...),
    descripcion: str = Form(...),
    payload: dict = Depends(require_pintor),
    db: Session = Depends(get_db)
):
    """
    Explicación: Recibe la imagen cifrada y el consentimiento firmado en el navegador,
    verifica la firma ECDSA y guarda el paquete cifrado.
    Espera recibir: multipart/form-data con el archivo cifrado, metadatos y consentimiento + JWT.
    Espera devolver: La obra creada (id, titulo, descripcion, estado, hash y firma del consentimiento).
    """
    # Se lee un byte de mas para detectar archivos que superan el limite sin cargarlos enteros
    contenido: bytes = archivo.file.read(pinturas_service.MAX_BYTES + 29)
    return pinturas_service.cargar_pintura(
        db, payload, contenido, id_pintura, tipo_mime, tamano_original,
        documento_consentimiento, firma_consentimiento, titulo, descripcion,
    )


@router.get("/{id_pintura}/imagen", response_model=None)
def imagen_de_mi_pintura(
    id_pintura: uuid.UUID,
    payload: dict = Depends(require_pintor),
    db: Session = Depends(get_db)
):
    """
    Explicación: Devuelve el paquete cifrado; solo el frontend puede descifrarlo en esta sesión.
    Espera recibir: `id_pintura` en la ruta + JWT de pintor.
    Espera devolver: Los bytes cifrados de la imagen.
    """
    cifrado = pinturas_service.obtener_imagen_cifrada_del_dueno(db, payload, id_pintura)
    return Response(
        content=cifrado,
        media_type="application/octet-stream",
        headers={"Cache-Control": "private, no-store"},
    )
