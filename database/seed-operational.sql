INSERT INTO produtos (nome, categoria, preco, codigo_barras, ativo)
SELECT 'Agua Mineral 500ml', 'Bebidas', 7.50, '789000000001', true
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Agua Mineral 500ml');

INSERT INTO produtos (nome, categoria, preco, codigo_barras, ativo)
SELECT 'Cafe da Manha Extra', 'Alimentos', 42.00, '789000000002', true
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Cafe da Manha Extra');

INSERT INTO produtos (nome, categoria, preco, codigo_barras, ativo)
SELECT 'Kit Amenidades Premium', 'Conveniencia', 35.00, '789000000003', true
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Kit Amenidades Premium');

INSERT INTO estoque (produto_id, quantidade_atual, estoque_minimo)
SELECT p.id, 120, 20
FROM produtos p
WHERE p.nome = 'Agua Mineral 500ml'
  AND NOT EXISTS (SELECT 1 FROM estoque e WHERE e.produto_id = p.id);

INSERT INTO estoque (produto_id, quantidade_atual, estoque_minimo)
SELECT p.id, 40, 10
FROM produtos p
WHERE p.nome = 'Cafe da Manha Extra'
  AND NOT EXISTS (SELECT 1 FROM estoque e WHERE e.produto_id = p.id);

INSERT INTO estoque (produto_id, quantidade_atual, estoque_minimo)
SELECT p.id, 25, 5
FROM produtos p
WHERE p.nome = 'Kit Amenidades Premium'
  AND NOT EXISTS (SELECT 1 FROM estoque e WHERE e.produto_id = p.id);

INSERT INTO hospedes (nome, cpf, email, telefone, data_nascimento, cidade, uf, consentimento_lgpd)
SELECT 'Marina Costa', '12345678900', 'marina@hospede.com', '11999999999', '1991-05-10', 'Sao Paulo', 'SP', true
WHERE NOT EXISTS (SELECT 1 FROM hospedes WHERE cpf = '12345678900');

INSERT INTO hospedes (nome, cpf, email, telefone, data_nascimento, cidade, uf, consentimento_lgpd)
SELECT 'Joao Prado', '98765432100', 'joao@hospede.com', '21988888888', '1988-11-23', 'Rio de Janeiro', 'RJ', true
WHERE NOT EXISTS (SELECT 1 FROM hospedes WHERE cpf = '98765432100');

INSERT INTO quartos (numero, tipo_acomodacao_id, tipo_quarto_id, andar, capacidade, status)
SELECT '101', ta.id, tq.id, 1, 2, 'livre'
FROM tipos_acomodacao ta, tipos_quarto tq
WHERE ta.nome = 'Apartamento' AND tq.nome = 'Luxo'
  AND NOT EXISTS (SELECT 1 FROM quartos WHERE numero = '101');

INSERT INTO quartos (numero, tipo_acomodacao_id, tipo_quarto_id, andar, capacidade, status)
SELECT '102', ta.id, tq.id, 1, 2, 'livre'
FROM tipos_acomodacao ta, tipos_quarto tq
WHERE ta.nome = 'Apartamento' AND tq.nome = 'Standard'
  AND NOT EXISTS (SELECT 1 FROM quartos WHERE numero = '102');

INSERT INTO quartos (numero, tipo_acomodacao_id, tipo_quarto_id, andar, capacidade, status)
SELECT '201', ta.id, tq.id, 2, 4, 'limpeza'
FROM tipos_acomodacao ta, tipos_quarto tq
WHERE ta.nome = 'Chale' AND tq.nome = 'Familia'
  AND NOT EXISTS (SELECT 1 FROM quartos WHERE numero = '201');

INSERT INTO reservas (hospede_id, quarto_id, data_checkin, data_checkout, adultos, criancas, observacoes, origem, status)
SELECT h.id, q.id, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 day', 2, 0, 'Reserva operacional de seed', 'direta', 'confirmada'
FROM hospedes h, quartos q
WHERE h.cpf = '12345678900' AND q.numero = '101'
  AND NOT EXISTS (
    SELECT 1
    FROM reservas r
    WHERE r.hospede_id = h.id
      AND r.quarto_id = q.id
      AND r.data_checkin = CURRENT_DATE
  );

INSERT INTO alertas_sistema (tipo, mensagem, severidade)
SELECT 'financeiro', 'Conciliar caixa do turno da manha', 'media'
WHERE NOT EXISTS (SELECT 1 FROM alertas_sistema WHERE mensagem = 'Conciliar caixa do turno da manha');
