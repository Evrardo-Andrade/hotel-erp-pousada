DO $$
BEGIN
  ALTER TYPE sale_type ADD VALUE IF NOT EXISTS 'room_service';
  ALTER TYPE sale_type ADD VALUE IF NOT EXISTS 'consumo_interno';
  ALTER TYPE sale_type ADD VALUE IF NOT EXISTS 'hospedagem';
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelado';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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

ALTER TABLE vendas ADD COLUMN IF NOT EXISTS reserva_id UUID REFERENCES reservas(id);
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS quarto_id UUID REFERENCES quartos(id);
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS operador_id UUID REFERENCES usuarios(id);
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS caixa_sessao_id UUID REFERENCES cash_register_sessions(id);
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS origem_venda VARCHAR(30) NOT NULL DEFAULT 'balcao';
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS desconto_geral NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS acrescimo NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS cupom_codigo VARCHAR(40);
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS lancar_na_conta BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS cobrar_imediatamente BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS documento_tipo VARCHAR(20);

ALTER TABLE itens_venda ADD COLUMN IF NOT EXISTS nome_produto VARCHAR(160);
ALTER TABLE itens_venda ADD COLUMN IF NOT EXISTS codigo_produto VARCHAR(60);
ALTER TABLE itens_venda ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE itens_venda ADD COLUMN IF NOT EXISTS valor_bruto NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE itens_venda iv
SET nome_produto = p.nome,
    codigo_produto = p.codigo_barras,
    valor_bruto = COALESCE(iv.quantidade, 0) * COALESCE(iv.preco_unitario, 0)
FROM produtos p
WHERE p.id = iv.produto_id
  AND (iv.nome_produto IS NULL OR iv.codigo_produto IS NULL OR iv.valor_bruto = 0);

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS operador_id UUID REFERENCES usuarios(id);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS origem VARCHAR(30) NOT NULL DEFAULT 'hotel';

CREATE INDEX IF NOT EXISTS idx_cash_sessions_operador_status ON cash_register_sessions (operador_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements (cash_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments (venda_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_session ON sale_payments (cash_session_id);
CREATE INDEX IF NOT EXISTS idx_vendas_sessao ON vendas (caixa_sessao_id);
CREATE INDEX IF NOT EXISTS idx_vendas_origem ON vendas (origem_venda);
CREATE INDEX IF NOT EXISTS idx_refunds_sale ON refunds (venda_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_entidade ON cancellations (entidade, entidade_id);
