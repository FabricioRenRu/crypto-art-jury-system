"""
app/routes/avatares.py
Sirve las fotos de perfil desde el almacenamiento (disco o bucket privado).
Mantiene la URL /static/avatars/<archivo> que ya guarda la BD y que usa el frontend.
"""
from fastapi import APIRouter, Response

import app.services.avatares_service as avatares_service

router = APIRouter(tags=["Avatares"])


@router.get("/static/avatars/{nombre_archivo}", response_model=None)
def obtener_avatar(nombre_archivo: str) -> Response:
    datos, mime = avatares_service.leer_foto_perfil(nombre_archivo)
    return Response(
        content=datos,
        media_type=mime,
        headers={
            "Cache-Control": "public, max-age=86400",  # el navegador la guarda un día
            "X-Content-Type-Options": "nosniff",       # que nunca se interprete como otro tipo
        },
    )