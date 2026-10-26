-- El cliente conserva la llave AES en memoria; la base solo persiste el ciphertext.
-- Conserva cualquier dato legado, pero permite insertar nuevas pinturas sin un sobre.
ALTER TABLE IF EXISTS pinturas
    ALTER COLUMN llave_aes_pintor_cifrada DROP NOT NULL;
