/**
 * hooks/usePainterPanel.ts
 * Carga el perfil y las obras del pintor desde el backend y las entrega con la MISMA
 * forma (PainterProfile / PainterArtwork) que antes salía de data/painterPanel.ts,
 * de modo que los componentes del panel no cambian.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '../api/apiClient';
import { DEFAULT_AVATAR_URL } from '../data/assets';
import { painterService } from '../services/painterService';
import { juradoService } from '../services/juradoService';
import { useCryptoWorker } from './useCryptoWorker';
import { Acciones } from '../workers/crypto.worker';
import type { PainterArtwork, PainterProfile } from '../types';
import type { PinturaResponse } from '../types/pintor';
import type { UploadArtworkData } from '../components/painter/UploadArtworkModal';
import type { PinturaCifrada } from '../services/painterService';

const PERFIL_VACIO: PainterProfile = {
  name: '',
  tournament: '',
  avatarUrl: DEFAULT_AVATAR_URL,
};

function obtenerIdPintorDeSesion(): string {
  const token = sessionStorage.getItem('access_token');
  const segmento = token?.split('.')[1];
  if (!segmento) throw new Error('La sesión del pintor no es válida.');

  const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(atob(base64));
  if (typeof payload.sub !== 'string') {
    throw new Error('No se encontró el identificador del pintor en la sesión.');
  }
  return payload.sub;
}

export const usePainterPanel = () => {
  const { ejecutarAccion } = useCryptoWorker();
  const [profile, setProfile] = useState<PainterProfile>(PERFIL_VACIO);
  const [artworks, setArtworks] = useState<PainterArtwork[]>([]);
  const [totalSlots, setTotalSlots] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // object URLs de las imágenes descifradas; se liberan al desmontar
  const urlsRef = useRef<string[]>([]);

  const aArtwork = useCallback(async (obra: PinturaResponse): Promise<PainterArtwork> => {
    let imageUrl = '';
    const llaveDisponible = await ejecutarAccion(Acciones.VERIFICAR_LLAVE_AES, {
      id_pintura: obra.id,
    });
    if (llaveDisponible.disponible) {
      const blobCifrado = await painterService.obtenerImagen(obra.id);
      const resultado = await ejecutarAccion(Acciones.DESCIFRAR_PINTURA, {
        id_pintura: obra.id,
        cifrado: new Uint8Array(await blobCifrado.arrayBuffer()),
      });
      const datos = new Uint8Array(resultado.datos);
      const imagen = new ArrayBuffer(datos.byteLength);
      new Uint8Array(imagen).set(datos);
      imageUrl = URL.createObjectURL(new Blob([imagen], { type: obra.tipo_mime }));
      urlsRef.current.push(imageUrl);
    }
    return {
      id: obra.id,
      slot: obra.slot,
      totalSlots: obra.total_slots,
      title: obra.titulo,
      description: obra.descripcion,
      status: obra.estado,
      imageUrl,
    };
  }, [ejecutarAccion]);

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [perfil, misObras] = await Promise.all([
        painterService.obtenerPerfil(),
        painterService.listarMisObras(),
      ]);
      setProfile({
        name: perfil.seudonimo || perfil.nombre,
        tournament: perfil.torneo,
        avatarUrl: perfil.foto_perfil ? `${API_URL}${perfil.foto_perfil}` : DEFAULT_AVATAR_URL,
      });
      setTotalSlots(misObras.total_slots);
      setArtworks(await Promise.all(misObras.obras.map(aArtwork)));
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar tu panel.');
    } finally {
      setIsLoading(false);
    }
  }, [aArtwork]);

  useEffect(() => {
    cargar();
    return () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
  }, [cargar]);

  /** Cifra la obra, firma el consentimiento y envuelve K_AES para cada juez antes de subirlos. */
  const uploadArtwork = async (data: UploadArtworkData) => {
    setError(null);
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(data.file.type)) {
        throw new Error('Formato no soportado. Sube una imagen PNG, JPG o WEBP.');
      }

      const idPintura = crypto.randomUUID();
      const cifrado = await ejecutarAccion(Acciones.CIFRAR_PINTURA, {
        id_pintura: idPintura,
        datos: new Uint8Array(await data.file.arrayBuffer()),
      });
      // Se bajan las llaves públicas del jurado y el worker arma un sobre RSA-OAEP por juez
      const llavesJurado = await juradoService.obtenerLlavesPublicas();
      const sobres = await ejecutarAccion(Acciones.GENERAR_SOBRES, {
        id_pintura: idPintura,
        jueces: llavesJurado.jueces,
      });
      const consentimiento = await ejecutarAccion(Acciones.FIRMAR_CONSENTIMIENTO, {
        id_pintura: idPintura,
        id_pintor: obtenerIdPintorDeSesion(),
        hash_cifrado: cifrado.hash_cifrado,
      });
      const pintura: PinturaCifrada = {
        id_pintura: idPintura,
        cifrado: cifrado.cifrado,
      };
      const obra = await painterService.cargarObra(
        pintura,
        consentimiento.documento,
        consentimiento.firma_hex,
        data.file.type,
        data.file.size,
        data.title,
        data.description,
        sobres.sobres,
      );
      const nueva = await aArtwork(obra);
      setArtworks((actuales) => [...actuales, nueva]);
    } catch (err: any) {
      setError(err.message || 'No se pudo subir la obra.');
    }
  };

  return { profile, artworks, totalSlots, isLoading, error, uploadArtwork };
};
