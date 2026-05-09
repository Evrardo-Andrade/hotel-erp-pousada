ALTER TABLE quartos
ADD COLUMN IF NOT EXISTS descricao TEXT;

INSERT INTO comodidades (nome, icone)
SELECT 'Ar Condicionado', 'snowflake'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Ar Condicionado');

INSERT INTO comodidades (nome, icone)
SELECT 'Frigobar', 'fridge'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Frigobar');

INSERT INTO comodidades (nome, icone)
SELECT 'TV', 'tv'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'TV');

INSERT INTO comodidades (nome, icone)
SELECT 'Smart TV', 'monitor'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Smart TV');

INSERT INTO comodidades (nome, icone)
SELECT 'Wi-Fi', 'wifi'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Wi-Fi');

INSERT INTO comodidades (nome, icone)
SELECT 'Chuveiro quente', 'droplets'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Chuveiro quente');

INSERT INTO comodidades (nome, icone)
SELECT 'Cama king', 'bed-double'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Cama king');

INSERT INTO comodidades (nome, icone)
SELECT 'Cama casal', 'bed'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Cama casal');

INSERT INTO comodidades (nome, icone)
SELECT 'Sofa-cama', 'sofa'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Sofa-cama');

INSERT INTO comodidades (nome, icone)
SELECT 'Cofre', 'shield'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Cofre');

INSERT INTO comodidades (nome, icone)
SELECT 'Secador', 'wind'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Secador');

INSERT INTO comodidades (nome, icone)
SELECT 'Micro-ondas', 'microwave'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Micro-ondas');

INSERT INTO comodidades (nome, icone)
SELECT 'Varanda', 'home'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Varanda');

INSERT INTO comodidades (nome, icone)
SELECT 'Vista piscina', 'waves'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Vista piscina');

INSERT INTO comodidades (nome, icone)
SELECT 'Vista jardim', 'trees'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Vista jardim');

INSERT INTO comodidades (nome, icone)
SELECT 'Acessivel PCD', 'accessibility'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Acessivel PCD');
