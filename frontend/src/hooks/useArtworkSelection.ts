/**
 * hooks/useArtworkSelection.ts
 * Hook personalizado que maneja qué obras están seleccionadas (checkboxes)
 * en la página "Visto Bueno Presidente".
 *
 * Reemplaza las funciones originales toggleSelectAll() y updateCounter()
 * que manipulaban el DOM directamente.
 */
import { useCallback, useMemo, useState } from 'react';
import type { Artwork } from '../types';

export function useArtworkSelection(artworks: Artwork[]) {
  /**
   * STATE: selectedIds
   * Conjunto (Set) con los IDs de las obras marcadas.
   * Inicia con TODAS seleccionadas, igual que en el HTML original (checked en todas).
   * Se usa Set porque buscar/agregar/quitar un ID es rápido y no permite duplicados.
   */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(artworks.map((a) => a.id)),
  );

  /** Valor derivado: cuántas obras hay seleccionadas (para el texto "X de Y"). */
  const selectedCount = selectedIds.size;

  /** Valor derivado: true si todas están marcadas (decide el texto del botón Marcar/Desmarcar). */
  const allSelected = useMemo(
    () => artworks.length > 0 && selectedCount === artworks.length,
    [artworks.length, selectedCount],
  );

  /** Marca o desmarca UNA obra por su ID. */
  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** Si están todas marcadas las desmarca; si no, las marca todas. */
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === artworks.length ? new Set() : new Set(artworks.map((a) => a.id)),
    );
  }, [artworks]);

  /** Indica si una obra concreta está seleccionada. */
  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return { selectedIds, selectedCount, allSelected, toggleOne, toggleAll, isSelected };
}
