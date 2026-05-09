ALTER TABLE produtos ADD COLUMN IF NOT EXISTS internal_code VARCHAR(60);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS image_filename VARCHAR(220);

CREATE INDEX IF NOT EXISTS idx_produtos_internal_code ON produtos (internal_code);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos (codigo_barras);
