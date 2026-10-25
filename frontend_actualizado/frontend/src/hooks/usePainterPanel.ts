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
import type { PainterArtwork, PainterProfile } from '../types';
import type { PinturaResponse } from '../types/pintor';
import type { UploadArtworkData } from '../components/painter/UploadArtworkModal';

const PERFIL_VACIO: PainterProfile = {
  name: '',
  tournament: '',
  avatarUrl: DEFAULT_AVATAR_URL,
};

export const usePainterPanel = () => {
  const [profile, setProfile] = useState<PainterProfile>(PERFIL_VACIO);
  const [artworks, setArtworks] = useState<PainterArtwork[]>([]);
  const [totalSlots, setTotalSlots] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // object URLs de las imágenes descifradas; se liberan al desmontar
  const urlsRef = useRef<string[]>([]);

  const aArtwork = useCallback(async (obra: PinturaResponse): Promise<PainterArtwork> => {
    let imageUrl = '';
    try {
      const blob = await painterService.obtenerImagen(obra.id);
      imageUrl = URL.createObjectURL(blob);
      urlsRef.current.push(imageUrl);
    } catch {
      // si no se puede descifrar, la tarjeta se muestra sin imagen
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
  }, []);

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

  /** Envía la obra; el servidor la cifra, firma el consentimiento y crea los sobres. */
  const uploadArtwork = async (data: UploadArtworkData) => {
    setError(null);
    try {
      const obra = await painterService.cargarObra(data.file, data.title, data.description);
      const nueva = await aArtwork(obra);
      setArtworks((actuales) => [...actuales, nueva]);
    } catch (err: any) {
      setError(err.message || 'No se pudo subir la obra.');
    }
  };

  return { profile, artworks, totalSlots, isLoading, error, uploadArtwork };
};
