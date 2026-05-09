ALTER TABLE comodidades
ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

UPDATE comodidades
SET ativo = true
WHERE ativo IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_comodidades_nome_unico
ON comodidades (LOWER(nome));
