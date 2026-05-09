ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'pre_reserva';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'pendente';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'hospedado';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'no_show';

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

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(30) NOT NULL DEFAULT 'consumo';
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS permite_combo BOOLEAN NOT NULL DEFAULT false;

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
