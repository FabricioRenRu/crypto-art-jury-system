-- Migracion para una BD ya creada con el esquema anterior.
-- (Base.metadata.create_all NO altera tablas existentes.)
-- Si estas en desarrollo, lo mas simple es:  docker compose down -v && docker compose up -d
--
-- PowerShell:
--   Get-Content migrations\001_custodia_llaves_en_servidor.sql | docker exec -i postgres-db psql -U lalito -d painting_db

BEGIN;

-- La privada NUNCA se guarda en el servidor. Por si aplicaste la version anterior de este parche:
ALTER TABLE pintores DROP COLUMN IF EXISTS clave_privada_cifrada;

-- La tabla pinturas nunca recibio filas (los endpoints eran stubs), por eso las
-- columnas nuevas pueden ser NOT NULL sin valor por defecto.
ALTER TABLE pinturas ADD COLUMN IF NOT EXISTS titulo VARCHAR(120) NOT NULL;
ALTER TABLE pinturas ADD COLUMN IF NOT EXISTS descripcion TEXT NOT NULL;
ALTER TABLE pinturas ADD COLUMN IF NOT EXISTS mime_type VARCHAR(50) NOT NULL;
ALTER TABLE pinturas ADD COLUMN IF NOT EXISTS hash_pintura_cifrada VARCHAR(64) NOT NULL;
ALTER TABLE pinturas ADD COLUMN IF NOT EXISTS llave_aes_pintor_cifrada TEXT NOT NULL;
ALTER TABLE pinturas ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT now();

COMMIT;
