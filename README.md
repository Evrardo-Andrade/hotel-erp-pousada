# ERP Hoteleiro Completo

Monorepo com um ERP para pousadas e hotelaria, cobrindo operacao, hospedagem, PDV, financeiro, room service, PWA do hospede e base fiscal para NF-e/NFC-e.

## Estrutura

- `backend`: API Express com JWT, WebSocket, auditoria, modulos ERP e integracao fiscal preparada.
- `frontend`: SPA React + PWA com dashboard operacional, grid de quartos, reservas, PDV e app do hospede.
- `database`: schema PostgreSQL com tabelas, enums, relacionamentos, indices e dados iniciais.

## Principais Modulos

- Dashboard operacional
- Quartos e acomodacoes
- Reservas e calendario
- Hospedes
- Check-in / Check-out
- Produtos e estoque
- PDV com NFC-e
- Room service em tempo real
- Financeiro
- Configuracoes fiscais
- Certificado digital A1
- Auditoria e logs

## Stack

- Backend: Node.js, Express, PostgreSQL, WebSocket, JWT
- Frontend: React, Vite, React Router
- App hospede: PWA responsivo
- Fiscal: infraestrutura para NF-e/NFC-e, assinatura digital, XML e eventos

## Como Executar

1. Criar um banco PostgreSQL.
2. Executar `database/schema.sql`.
3. Configurar variaveis de ambiente em `backend/.env`.
4. Instalar dependencias em `backend` e `frontend`.
5. Subir API e frontend.

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Fluxo Operacional

1. Cadastro de configuracoes da empresa, fiscal e certificado.
2. Cadastro dos tipos de acomodacao, quartos e comodidades.
3. Registro da reserva e disponibilidade.
4. Check-in com abertura de conta e QR Code do hospede.
5. Consumo via PDV ou PWA.
6. Pedidos internos com atualizacao em tempo real.
7. Integracao automatica com financeiro.
8. Check-out com fechamento da conta e emissao de NF-e.

## Observacoes

- O backend foi modelado para crescer com servicos externos reais de emissao fiscal, gateways, fechaduras e ERPs complementares.
- A camada fiscal contem interfaces e estrategia para homologacao/producao, persistencia XML e eventos de cancelamento/correcao.
- Para producao, recomenda-se complementar com fila assincorna, cache Redis, monitoramento e cofre de segredos.
