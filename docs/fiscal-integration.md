# Integracao Fiscal e Hardening

## O que foi implementado

- Camada fiscal separada em:
  - `FiscalDocumentBuilder`: monta payload fiscal de NF-e/NFC-e.
  - `SefazClient`: organiza endpoint, assinatura logica e autorizacao/cancelamento.
  - `DanfeService`: gera HTML de DANFE para impressao operacional.
  - `FiscalService`: orquestra contexto, autorizacao, persistencia e cancelamento.
- Persistencia fiscal expandida em `documentos_fiscais` com:
  - `protocolo`
  - `recibo`
  - `ambiente`
  - `endpoint`
  - `payload`
  - `danfe_html`
  - `protocolo_cancelamento`
- RBAC por permissao com autorizacao por escopo.
- Hardening inicial com `X-Request-Id`, rate limit em memoria e `trust proxy` configuravel.
- Seed operacional complementar em `database/seed-operational.sql`.

## Limite atual desta etapa

Esta integracao ja organiza o fluxo fiscal de forma profissional, mas a comunicacao com SEFAZ ainda esta em modo estruturado/simulavel dentro do proprio backend. Para homologacao real, faltam:

- Biblioteca de assinatura XML com certificado A1 real
- SOAP client compativel com NF-e/NFC-e
- Validacao XSD oficial
- Tratamento de recibo assincorno, inutilizacao e carta de correcao
- Emissao de DANFE em PDF

## Fluxo atual

1. API monta o contexto da venda ou check-out.
2. Builder gera o payload fiscal.
3. `SefazClient` resolve endpoint por ambiente e assina logicamente o envelope.
4. `FiscalService` persiste XML, payload, chave, recibo, protocolo e DANFE HTML.
5. Cancelamento fiscal tambem gera protocolo de cancelamento e atualiza a trilha.

## Arquivos principais

- `backend/src/services/fiscal-service.js`
- `backend/src/services/fiscal-document-builder.js`
- `backend/src/services/sefaz-client.js`
- `backend/src/services/danfe-service.js`
- `backend/src/middleware/auth.js`
- `backend/src/middleware/security.js`
- `database/schema.sql`
- `database/seed-operational.sql`

## Proximo passo recomendado

Quando o ambiente permitir instalar dependencias e validar externamente:

1. Adicionar cliente SOAP/XML assinado.
2. Carregar o `.pfx` de verdade e extrair cadeia/certificado.
3. Validar XML pelos schemas oficiais por modelo.
4. Converter `danfe_html` para PDF.
5. Criar fila para contingencia e reprocessamento SEFAZ.
