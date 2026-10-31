-- El juez guarda su evaluación cifrada (AES-GCM, llave derivada de su propia llave privada)
-- para poder descegar y publicar aunque recargue la página. El servidor no la puede leer.
BEGIN;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS evaluacion_cifrada TEXT;
COMMIT;