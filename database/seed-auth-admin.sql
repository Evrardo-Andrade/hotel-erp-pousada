INSERT INTO usuarios (nome, email, senha_hash, papel, ativo)
SELECT
  'Administrador ERP',
  'admin@erp.com',
  '$2a$10$dlhEoBBg83pWy/03fC170OeroBlv0r/ccz9A9pDqyuWSRe2smPAVy',
  'admin',
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM usuarios
  WHERE LOWER(email) = LOWER('admin@erp.com')
);
