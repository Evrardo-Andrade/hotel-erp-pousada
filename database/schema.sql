CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
    CREATE TYPE room_status AS ENUM ('livre', 'ocupado', 'limpeza', 'manutencao');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE reservation_status AS ENUM ('confirmada', 'checkin_realizado', 'checkout_realizado', 'cancelada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_type') THEN
    CREATE TYPE sale_type AS ENUM ('balcao', 'hospede');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
    CREATE TYPE sale_status AS ENUM ('concluida', 'cancelada', 'estornada', 'devolvida');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('novo', 'em_preparo', 'entregue');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_type') THEN
    CREATE TYPE financial_type AS ENUM ('receita', 'despesa');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_status') THEN
    CREATE TYPE financial_status AS ENUM ('aberto', 'liquidado', 'cancelado');
  END IF;
END $$;

ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'pre_reserva';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'pendente';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'hospedado';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'bloqueado';
ALTER TYPE sale_type ADD VALUE IF NOT EXISTS 'room_service';
ALTER TYPE sale_type ADD VALUE IF NOT EXISTS 'consumo_interno';
ALTER TYPE sale_type ADD VALUE IF NOT EXISTS 'hospedagem';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelado';

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  papel VARCHAR(50) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tipos_acomodacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tipos_quarto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  diaria_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE tipos_acomodacao ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE tipos_acomodacao ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE tipos_quarto ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE tipos_quarto ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS comodidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(120) NOT NULL,
  icone VARCHAR(80),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE comodidades ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS quartos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(20) UNIQUE NOT NULL,
  tipo_acomodacao_id UUID NOT NULL REFERENCES tipos_acomodacao(id),
  tipo_quarto_id UUID NOT NULL REFERENCES tipos_quarto(id),
  andar INT,
  capacidade INT NOT NULL,
  status room_status NOT NULL DEFAULT 'livre',
  descricao TEXT,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE quartos ADD COLUMN IF NOT EXISTS descricao TEXT;

CREATE TABLE IF NOT EXISTS quartos_comodidades (
  quarto_id UUID NOT NULL REFERENCES quartos(id) ON DELETE CASCADE,
  comodidade_id UUID NOT NULL REFERENCES comodidades(id) ON DELETE CASCADE,
  PRIMARY KEY (quarto_id, comodidade_id)
);

CREATE TABLE IF NOT EXISTS hospedes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(160) NOT NULL,
  cpf VARCHAR(14),
  nome_social VARCHAR(160),
  email VARCHAR(160),
  telefone VARCHAR(30) NOT NULL,
  whatsapp VARCHAR(30),
  data_nascimento DATE,
  genero VARCHAR(30),
  nacionalidade VARCHAR(80),
  profissao VARCHAR(120),
  tipo_documento VARCHAR(40),
  numero_documento VARCHAR(60),
  orgao_emissor VARCHAR(60),
  uf_emissor CHAR(2),
  data_emissao_documento DATE,
  validade_documento DATE,
  cep VARCHAR(12),
  logradouro VARCHAR(180),
  numero_endereco VARCHAR(20),
  complemento VARCHAR(120),
  bairro VARCHAR(120),
  endereco TEXT,
  cidade VARCHAR(120),
  uf CHAR(2),
  pais VARCHAR(80),
  motivo_viagem VARCHAR(40),
  meio_transporte VARCHAR(60),
  procedencia VARCHAR(140),
  destino VARCHAR(140),
  data_prevista_chegada DATE,
  data_prevista_saida DATE,
  observacoes_internas TEXT,
  responsavel_legal_nome VARCHAR(160),
  responsavel_legal_cpf VARCHAR(14),
  responsavel_legal_documento VARCHAR(60),
  responsavel_legal_telefone VARCHAR(30),
  responsavel_legal_parentesco VARCHAR(60),
  responsavel_legal_observacoes TEXT,
  autorizacao_anexada BOOLEAN NOT NULL DEFAULT false,
  consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
  consentimento_lgpd_em TIMESTAMP,
  finalidade_lgpd TEXT,
  documento_conferido BOOLEAN NOT NULL DEFAULT false,
  documento_conferido_em TIMESTAMP,
  documento_conferido_por VARCHAR(120),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guest_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES hospedes(id),
  document_type VARCHAR(60) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  description TEXT,
  uploaded_by VARCHAR(120),
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guest_lgpd_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES hospedes(id),
  consent_type VARCHAR(60) NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMP,
  accepted_by VARCHAR(120),
  purpose TEXT,
  ip_address VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS guest_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES hospedes(id),
  action VARCHAR(80) NOT NULL,
  document_id UUID REFERENCES guest_documents(id),
  user_id VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS reservas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospede_id UUID NOT NULL REFERENCES hospedes(id),
  quarto_id UUID NOT NULL REFERENCES quartos(id),
  codigo_reserva VARCHAR(40) UNIQUE,
  data_checkin DATE NOT NULL,
  data_checkout DATE NOT NULL,
  adultos INT NOT NULL DEFAULT 1,
  criancas INT NOT NULL DEFAULT 0,
  observacoes TEXT,
  origem VARCHAR(50),
  status reservation_status NOT NULL DEFAULT 'pendente',
  quantidade_hospedes INT NOT NULL DEFAULT 1,
  numero_diarias INT NOT NULL DEFAULT 1,
  valor_diaria NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal_hospedagem NUMERIC(12,2) NOT NULL DEFAULT 0,
  taxas_adicionais NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  forma_pagamento VARCHAR(40),
  status_pagamento VARCHAR(30) NOT NULL DEFAULT 'pendente',
  valor_pago NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_pendente NUMERIC(12,2) NOT NULL DEFAULT 0,
  observacoes_internas TEXT,
  preferencias_hospede TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE reservas ADD COLUMN IF NOT EXISTS codigo_reserva VARCHAR(40);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS quantidade_hospedes INT NOT NULL DEFAULT 1;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS numero_diarias INT NOT NULL DEFAULT 1;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS valor_diaria NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS subtotal_hospedagem NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS taxas_adicionais NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS desconto NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS valor_total NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(40);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS status_pagamento VARCHAR(30) NOT NULL DEFAULT 'pendente';
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS saldo_pendente NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS preferencias_hospede TEXT;

CREATE TABLE IF NOT EXISTS contas_hospedagem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reserva_id UUID NOT NULL REFERENCES reservas(id),
  hospede_id UUID NOT NULL REFERENCES hospedes(id),
  quarto_id UUID NOT NULL REFERENCES quartos(id),
  status VARCHAR(30) NOT NULL,
  saldo_atual NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(160) NOT NULL,
  categoria VARCHAR(120) NOT NULL,
  preco NUMERIC(12,2) NOT NULL,
  codigo_barras VARCHAR(60),
  internal_code VARCHAR(60),
  image_url TEXT,
  image_filename VARCHAR(220),
  tipo_produto VARCHAR(30) NOT NULL DEFAULT 'consumo',
  permite_combo BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(30) NOT NULL DEFAULT 'consumo';
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS permite_combo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS internal_code VARCHAR(60);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS image_filename VARCHAR(220);

CREATE TABLE IF NOT EXISTS estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID UNIQUE NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_atual NUMERIC(12,2) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservation_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES hospedes(id),
  tipo VARCHAR(20) NOT NULL DEFAULT 'principal',
  documento VARCHAR(30),
  telefone VARCHAR(30),
  email VARCHAR(160),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combo_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(160) NOT NULL,
  descricao TEXT,
  preco NUMERIC(12,2) NOT NULL DEFAULT 0,
  duracao_minutos INT NOT NULL DEFAULT 60,
  ativo BOOLEAN NOT NULL DEFAULT true,
  limite_por_dia INT NOT NULL DEFAULT 1,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combo_definition_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combo_definition_id UUID NOT NULL REFERENCES combo_definitions(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservation_combo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  combo_definition_id UUID NOT NULL REFERENCES combo_definitions(id),
  quantidade NUMERIC(12,2) NOT NULL,
  preco_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'contratado',
  data_agendada TIMESTAMP,
  observacoes TEXT,
  executed_at TIMESTAMP,
  executed_by UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id),
  tipo VARCHAR(20) NOT NULL,
  quantidade NUMERIC(12,2) NOT NULL,
  reserva_id UUID REFERENCES reservas(id),
  hospede_id UUID REFERENCES hospedes(id),
  combo_reserva_id UUID REFERENCES reservation_combo_items(id),
  usuario_id UUID,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservation_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  forma_pagamento VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  valor NUMERIC(12,2) NOT NULL,
  pago_em TIMESTAMP,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operador_id UUID NOT NULL REFERENCES usuarios(id),
  status VARCHAR(20) NOT NULL DEFAULT 'aberto',
  opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP,
  valor_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_vendido NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_suprimentos NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_sangrias NUMERIC(12,2) NOT NULL DEFAULT 0,
  dinheiro_contado NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cartao_debito NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cartao_credito NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_pix NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_voucher NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_transferencia NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_faturado NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cortesia NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_outros NUMERIC(12,2) NOT NULL DEFAULT 0,
  diferenca_caixa NUMERIC(12,2) NOT NULL DEFAULT 0,
  fechamento_resumo JSONB,
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_session_id UUID NOT NULL REFERENCES cash_register_sessions(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  motivo VARCHAR(200) NOT NULL,
  operador_id UUID REFERENCES usuarios(id),
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(40) UNIQUE NOT NULL,
  tipo sale_type NOT NULL,
  hospede_id UUID REFERENCES hospedes(id),
  conta_hospedagem_id UUID REFERENCES contas_hospedagem(id),
  reserva_id UUID REFERENCES reservas(id),
  quarto_id UUID REFERENCES quartos(id),
  operador_id UUID REFERENCES usuarios(id),
  caixa_sessao_id UUID REFERENCES cash_register_sessions(id),
  origem_venda VARCHAR(30) NOT NULL DEFAULT 'balcao',
  valor_total NUMERIC(12,2) NOT NULL,
  metodo_pagamento VARCHAR(40) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto_geral NUMERIC(12,2) NOT NULL DEFAULT 0,
  acrescimo NUMERIC(12,2) NOT NULL DEFAULT 0,
  cupom_codigo VARCHAR(40),
  observacoes TEXT,
  lancar_na_conta BOOLEAN NOT NULL DEFAULT false,
  cobrar_imediatamente BOOLEAN NOT NULL DEFAULT true,
  documento_tipo VARCHAR(20),
  status sale_status NOT NULL DEFAULT 'concluida',
  status_fiscal VARCHAR(30) NOT NULL DEFAULT 'pendente',
  numero_fiscal VARCHAR(40),
  serie_fiscal VARCHAR(10),
  chave_acesso VARCHAR(80),
  xml_fiscal TEXT,
  motivo_cancelamento TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens_venda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade NUMERIC(12,2) NOT NULL,
  preco_unitario NUMERIC(12,2) NOT NULL,
  desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  nome_produto VARCHAR(160),
  codigo_produto VARCHAR(60),
  observacoes TEXT,
  valor_bruto NUMERIC(12,2) NOT NULL DEFAULT 0,
  motivo_ajuste TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  cash_session_id UUID REFERENCES cash_register_sessions(id),
  metodo VARCHAR(40) NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
  observacoes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  item_venda_id UUID REFERENCES itens_venda(id) ON DELETE SET NULL,
  quantidade NUMERIC(12,2) NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  motivo TEXT NOT NULL,
  operador_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cancellations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidade VARCHAR(50) NOT NULL,
  entidade_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  politica_multa VARCHAR(120),
  estorno_parcial BOOLEAN NOT NULL DEFAULT false,
  estorno_total BOOLEAN NOT NULL DEFAULT false,
  operador_id UUID REFERENCES usuarios(id),
  supervisor_senha_hash TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospede_id UUID NOT NULL REFERENCES hospedes(id),
  quarto_id UUID NOT NULL REFERENCES quartos(id),
  conta_hospedagem_id UUID NOT NULL REFERENCES contas_hospedagem(id),
  area_entrega VARCHAR(120),
  valor_total NUMERIC(12,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'novo',
  confirmado_pelo_hospede BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  operador_id UUID REFERENCES usuarios(id),
  origem VARCHAR(30) NOT NULL DEFAULT 'hotel',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  nome_produto VARCHAR(160) NOT NULL,
  quantidade NUMERIC(12,2) NOT NULL,
  preco_unitario NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financeiro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo financial_type NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  origem_modulo VARCHAR(60),
  origem_id UUID,
  data_lancamento TIMESTAMP NOT NULL,
  status financial_status NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave VARCHAR(80) UNIQUE NOT NULL,
  secao VARCHAR(50) NOT NULL,
  valor JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_name VARCHAR(180),
  legal_name VARCHAR(180),
  cnpj VARCHAR(18),
  state_registration VARCHAR(40),
  municipal_registration VARCHAR(40),
  cnae VARCHAR(20),
  tax_regime VARCHAR(80),
  phone VARCHAR(30),
  whatsapp VARCHAR(30),
  email VARCHAR(160),
  zip_code VARCHAR(12),
  street VARCHAR(180),
  number VARCHAR(20),
  complement VARCHAR(120),
  district VARCHAR(120),
  city VARCHAR(120),
  state CHAR(2),
  country VARCHAR(80),
  logo_url TEXT,
  logo_filename VARCHAR(255),
  primary_color VARCHAR(20),
  default_theme VARCHAR(40),
  admin_name VARCHAR(160),
  admin_email VARCHAR(160),
  admin_phone VARCHAR(30),
  admin_user_id UUID REFERENCES usuarios(id),
  admin_access_profile VARCHAR(40),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_arquivo VARCHAR(160) NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  senha_criptografada TEXT NOT NULL,
  validade DATE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documentos_fiscais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(10) NOT NULL,
  referencia_id UUID NOT NULL,
  chave_acesso VARCHAR(80) NOT NULL,
  numero VARCHAR(40) NOT NULL,
  serie VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  xml TEXT NOT NULL,
  evento_cancelamento TEXT,
  protocolo VARCHAR(80),
  recibo VARCHAR(80),
  ambiente VARCHAR(20),
  endpoint TEXT,
  payload JSONB,
  danfe_html TEXT,
  protocolo_cancelamento VARCHAR(80),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE documentos_fiscais ADD COLUMN IF NOT EXISTS protocolo VARCHAR(80);
ALTER TABLE documentos_fiscais ADD COLUMN IF NOT EXISTS recibo VARCHAR(80);
ALTER TABLE documentos_fiscais ADD COLUMN IF NOT EXISTS ambiente VARCHAR(20);
ALTER TABLE documentos_fiscais ADD COLUMN IF NOT EXISTS endpoint TEXT;
ALTER TABLE documentos_fiscais ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE documentos_fiscais ADD COLUMN IF NOT EXISTS danfe_html TEXT;
ALTER TABLE documentos_fiscais ADD COLUMN IF NOT EXISTS protocolo_cancelamento VARCHAR(80);

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(80) NOT NULL,
  entidade VARCHAR(120) NOT NULL,
  entidade_id UUID,
  usuario_id UUID,
  payload JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertas_sistema (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(80) NOT NULL,
  mensagem TEXT NOT NULL,
  severidade VARCHAR(20) NOT NULL DEFAULT 'media',
  resolvido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservas_periodo ON reservas (data_checkin, data_checkout);
CREATE INDEX IF NOT EXISTS idx_reservas_codigo ON reservas (codigo_reserva);
CREATE INDEX IF NOT EXISTS idx_quartos_status ON quartos (status);
CREATE INDEX IF NOT EXISTS idx_vendas_hospede ON vendas (hospede_id);
CREATE INDEX IF NOT EXISTS idx_vendas_sessao ON vendas (caixa_sessao_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_operador_status ON cash_register_sessions (operador_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements (cash_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_payments_session ON sale_payments (cash_session_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments (venda_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_data ON financeiro (data_lancamento);
CREATE INDEX IF NOT EXISTS idx_logs_entidade ON logs (entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_reservation_combo_items_reservation ON reservation_combo_items (reservation_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reserva ON stock_movements (reserva_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_reservation ON reservation_payments (reservation_id);

INSERT INTO tipos_acomodacao (nome, descricao)
SELECT 'Chale', 'Acomodacao independente com maior privacidade'
WHERE NOT EXISTS (SELECT 1 FROM tipos_acomodacao WHERE nome = 'Chale');

INSERT INTO tipos_acomodacao (nome, descricao)
SELECT 'Apartamento', 'Quarto padrao em bloco principal'
WHERE NOT EXISTS (SELECT 1 FROM tipos_acomodacao WHERE nome = 'Apartamento');

INSERT INTO tipos_acomodacao (nome, descricao)
SELECT 'Dormitorio', 'Acomodacao compartilhada'
WHERE NOT EXISTS (SELECT 1 FROM tipos_acomodacao WHERE nome = 'Dormitorio');

INSERT INTO tipos_quarto (nome, descricao, diaria_base)
SELECT 'Luxo', 'Quarto premium', 450
WHERE NOT EXISTS (SELECT 1 FROM tipos_quarto WHERE nome = 'Luxo');

INSERT INTO tipos_quarto (nome, descricao, diaria_base)
SELECT 'Standard', 'Quarto padrao', 260
WHERE NOT EXISTS (SELECT 1 FROM tipos_quarto WHERE nome = 'Standard');

INSERT INTO tipos_quarto (nome, descricao, diaria_base)
SELECT 'Familia', 'Quarto familiar', 390
WHERE NOT EXISTS (SELECT 1 FROM tipos_quarto WHERE nome = 'Familia');

INSERT INTO comodidades (nome, icone)
SELECT 'Wi-Fi', 'wifi'
WHERE NOT EXISTS (SELECT 1 FROM comodidades WHERE nome = 'Wi-Fi');

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

INSERT INTO configuracoes (chave, secao, valor)
SELECT 'empresa', 'geral', '{"razaoSocial":"Pousada Exemplo","cnpj":"00.000.000/0001-00","telefone":"(11) 3333-0000"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM configuracoes WHERE chave = 'empresa');

INSERT INTO configuracoes (chave, secao, valor)
SELECT 'fiscal_nfce', 'fiscal', '{"serie":"1","cfop":"5102","csc_id":"000001","csc":"TOKEN-CSC"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM configuracoes WHERE chave = 'fiscal_nfce');

INSERT INTO configuracoes (chave, secao, valor)
SELECT 'fiscal_nfe', 'fiscal', '{"serie":"1","cfop":"5933","naturezaOperacao":"Prestacao de servico de hospedagem"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM configuracoes WHERE chave = 'fiscal_nfe');

INSERT INTO alertas_sistema (tipo, mensagem, severidade)
SELECT 'certificado', 'Certificado A1 vence em 20 dias', 'alta'
WHERE NOT EXISTS (SELECT 1 FROM alertas_sistema WHERE mensagem = 'Certificado A1 vence em 20 dias');

UPDATE produtos
SET tipo_produto = 'consumo'
WHERE tipo_produto IS NULL;

UPDATE produtos
SET permite_combo = true
WHERE nome IN (
  'Agua Mineral 500ml',
  'Agua Mineral',
  'Cafe da Manha Extra',
  'Kit Amenidades Premium',
  'Sanduiche Natural'
);

INSERT INTO combo_definitions (nome, descricao, preco, duracao_minutos, ativo, limite_por_dia, observacoes)
SELECT 'Passeio de Barco Premium', 'Experiencia nautica com bebidas e kit de apoio.', 320, 180, true, 4, 'Executar somente com agenda confirmada'
WHERE NOT EXISTS (SELECT 1 FROM combo_definitions WHERE nome = 'Passeio de Barco Premium');

INSERT INTO combo_definitions (nome, descricao, preco, duracao_minutos, ativo, limite_por_dia, observacoes)
SELECT 'Jantar Romantico', 'Servico especial com ambientacao e menu premium.', 280, 120, true, 3, 'Montagem sob demanda'
WHERE NOT EXISTS (SELECT 1 FROM combo_definitions WHERE nome = 'Jantar Romantico');
