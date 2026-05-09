ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS nome_social VARCHAR(160);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS genero VARCHAR(30);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS nacionalidade VARCHAR(80);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS profissao VARCHAR(120);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(40);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(60);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS orgao_emissor VARCHAR(60);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS uf_emissor CHAR(2);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS data_emissao_documento DATE;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS validade_documento DATE;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS cep VARCHAR(12);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS logradouro VARCHAR(180);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS numero_endereco VARCHAR(20);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS complemento VARCHAR(120);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS bairro VARCHAR(120);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS pais VARCHAR(80);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS motivo_viagem VARCHAR(40);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS meio_transporte VARCHAR(60);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS procedencia VARCHAR(140);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS destino VARCHAR(140);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS data_prevista_chegada DATE;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS data_prevista_saida DATE;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS responsavel_legal_nome VARCHAR(160);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS responsavel_legal_cpf VARCHAR(14);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS responsavel_legal_documento VARCHAR(60);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS responsavel_legal_telefone VARCHAR(30);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS responsavel_legal_parentesco VARCHAR(60);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS responsavel_legal_observacoes TEXT;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS autorizacao_anexada BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS consentimento_lgpd_em TIMESTAMP;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS finalidade_lgpd TEXT;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS documento_conferido BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS documento_conferido_em TIMESTAMP;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS documento_conferido_por VARCHAR(120);
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE hospedes ADD COLUMN IF NOT EXISTS documento_rg VARCHAR(30);
ALTER TABLE hospedes ALTER COLUMN cpf DROP NOT NULL;

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
