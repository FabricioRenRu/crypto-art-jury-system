-- Regresa el intercambio de sobres RSA-OAEP: K_AES se envuelve en el navegador del pintor
-- con la llave publica de cada juez y el servidor solo guarda los sobres.
-- (Base.metadata.create_all crea sobres_llave si no existe, pero NO altera tablas existentes.)
--
-- PowerShell:
--   Get-Content migrations\004_sobres_rsa_oaep.sql | docker exec -i postgres-db psql -U lalito -d painting_db
-- Despues corre  python seed_jurados.py  para generar las llaves de los jueces que no tengan.

BEGIN;

ALTER TABLE jurados ADD COLUMN IF NOT EXISTS clave_publica_rsa TEXT;

CREATE TABLE IF NOT EXISTS sobres_llave (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pintura UUID REFERENCES pinturas(id),
    id_jurado UUID REFERENCES jurados(id),
    llave_aes_cifrada TEXT NOT NULL,
    UNIQUE (id_pintura, id_jurado)
);

COMMIT;
