"""
/app/services/resultados_service.py
"""
from collections import defaultdict

from sqlalchemy.orm import Session

import app.repositories.evaluaciones_repository as evaluaciones_repository
import app.services.presidente_service as presidente_service
from app.schemas.resultados_schemas import EvaluacionPublica, ObraPublica, TableroPublicoResponse
from app.services.jurado_service import codigo_anonimo
from app.utils import crypto


def obtener_tablero_publico(db: Session) -> TableroPublicoResponse:
    """
    Funcion para la Zona de Verificación Pública. Expone las evaluaciones publicadas con todo lo necesario
    para que cualquiera verifique las firmas, y el ranking por suma de estrellas.
    """

    llave_presidente: str = presidente_service.obtener_llave_publica(db).clave_publica_rsa

    por_pintura = defaultdict(list)
    for ev in evaluaciones_repository.find_publicadas(db):
        por_pintura[ev.id_pintura].append(ev)

    obras: list[ObraPublica] = []
    for evaluaciones in por_pintura.values():
        pintura = evaluaciones[0].pintura
        # Solo entra al podio cuando TODOS los jueces con sobre ya publicaron
        if len(evaluaciones) < len(pintura.sobres):
            continue

        publicas = [
            EvaluacionPublica(
                id_evaluacion=ev.id,
                id_juez=ev.id_jurado,
                juez=ev.juez.nombre,
                clave_publica_juez=ev.juez.clave_publica_rsa,
                estrellas=ev.estrellas,
                comentario=ev.comentarios,
                texto_canonico=crypto.texto_evaluacion_canonico(
                    ev.id_pintura, ev.id_jurado, ev.estrellas, ev.comentarios
                ),
                hash_original=ev.hash_original,
                firma_descegada=ev.firma_descegada,
                firma_juez=ev.firma_del_juez,
            )
            for ev in sorted(evaluaciones, key=lambda e: e.juez.nombre)
        ]
        obras.append(
            ObraPublica(
                id_pintura=pintura.id,
                codigo_anonimo=codigo_anonimo(pintura.id),
                titulo=pintura.titulo,
                seudonimo=pintura.pintor.seudonimo,
                total_estrellas=sum(e.estrellas for e in publicas),
                posicion=0,
                evaluaciones=publicas,
            )
        )

    obras.sort(key=lambda o: (-o.total_estrellas, o.titulo))
    for indice, obra in enumerate(obras, start=1):
        obra.posicion = indice

    return TableroPublicoResponse(llave_publica_presidente=llave_presidente, obras=obras)