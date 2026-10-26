-- Las llaves RSA de los jueces ya no se usan al retirar el intercambio de sobres.
-- Conserva cualquier valor legado, pero permite nuevos registros sin llave RSA.
ALTER TABLE IF EXISTS jurados
    ALTER COLUMN clave_publica_rsa DROP NOT NULL;
