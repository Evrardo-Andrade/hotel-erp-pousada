# API ERP Hoteleiro

Base URL: `http://localhost:3333/api`

## Autenticacao

### `POST /auth/login`

```json
{
  "email": "admin@pousada.com",
  "password": "123456"
}
```

## Dashboard

### `GET /dashboard`

Retorna ocupacao, receita do dia, check-ins/check-outs e alertas.

## Quartos

### `GET /rooms`

Lista quartos com tipologia.

### `POST /rooms/bulk-generate`

Gera quartos em lote.

### `PATCH /rooms/:id/status`

Atualiza status operacional: `livre`, `ocupado`, `limpeza`, `manutencao`.

## Reservas

### `GET /reservations`

Lista reservas.

### `GET /reservations/availability?checkin=2026-04-21&checkout=2026-04-25`

Consulta disponibilidade.

### `POST /reservations`

Cria reserva vinculando hospede e quarto.

## Hospedes

### `GET /guests`

Lista hospedes.

### `GET /guests/:id`

Retorna cadastro, historico e consumo.

### `POST /guests`

Cria hospede.

## Hospedagem

### `POST /stay/check-in`

Efetiva check-in, cria conta de hospedagem e devolve QR Code do app.

### `POST /stay/check-out`

Fecha conta, muda status do quarto e emite NF-e.

### `GET /stay/guest/:accountId`

Consulta dados da conta do hospede.

## Produtos e Estoque

### `GET /products`

Lista produtos com estoque.

### `POST /products`

Cria produto e saldo inicial de estoque.

## PDV

### `POST /pos/sales`

Cria venda de balcao ou para hospede.

### `POST /pos/sales/:id/fiscal/nfce`

Emite NFC-e.

### `POST /pos/sales/:id/cancel`

Cancela venda.

### `POST /pos/sales/:id/price-change`

Registra ajuste de preco com motivo.

## Pedidos

### `GET /orders`

Lista pedidos de room service.

### `POST /orders`

Cria pedido e debita conta do hospede.

### `PATCH /orders/:id/status`

Atualiza status do pedido.

## Financeiro

### `GET /finance/summary`

Resumo de receitas, despesas e saldo.

### `GET /finance/cashflow`

Fluxo de caixa dos ultimos dias.

### `POST /finance/entries`

Cria lancamento manual.

## Configuracoes

### `GET /settings`

Retorna configuracoes gerais e fiscais.

### `POST /settings`

Atualiza uma chave de configuracao.

### `POST /settings/certificate`

Faz upload do certificado A1 com senha criptografada.

## Fiscal

### `POST /fiscal/documents/cancel`

Cancela documento fiscal persistido.

## Auditoria

### `GET /logs`

Ultimos eventos auditados do sistema.
