# Modulo de Reservas

## Observacao sobre banco

O pedido menciona MySQL, mas esta base do projeto esta implementada com PostgreSQL. As migrations e queries foram mantidas coerentes com o repositorio real para nao quebrar a stack existente.

## Entregue

- tela profissional de reservas com `Nova Reserva`
- drawer operacional com:
  - dados do hospede
  - reserva
  - acomodacao
  - pagamento
  - combos contratados
  - observacoes
- cadastro rapido de hospede
- cadastro e edicao de combos
- calendario visual por quarto
- endpoints completos de reservas e combos
- fallback mock para reservas, combos, pagamentos e consumo
- modelagem para pagamentos, acompanhantes, combos e movimentos de estoque

## Endpoints principais

### Reservas

- `GET /api/reservations`
- `GET /api/reservations/:id`
- `POST /api/reservations`
- `PUT /api/reservations/:id`
- `PATCH /api/reservations/:id/status`
- `DELETE /api/reservations/:id`
- `GET /api/reservations/metadata`
- `GET /api/reservations/availability`
- `POST /api/reservations/:id/add-combo`
- `POST /api/reservations/:id/execute-combo`
- `GET /api/reservations/:id/consumption`

### Combos

- `GET /api/combos`
- `POST /api/combos`
- `PUT /api/combos/:id`
- `DELETE /api/combos/:id`

## Exemplo de payload de reserva

```json
{
  "hospede_id": "guest-uuid",
  "documento": "123.456.789-00",
  "telefone": "(11) 99999-9999",
  "email": "marina@email.com",
  "data_checkin": "2026-05-12",
  "data_checkout": "2026-05-15",
  "adultos": 2,
  "criancas": 0,
  "quantidade_hospedes": 2,
  "observacoes": "Chegada prevista para 16h",
  "quarto_id": "room-uuid",
  "tipo_acomodacao_id": "accommodation-type-uuid",
  "tipo_quarto_id": "room-type-uuid",
  "valor_diaria": 320,
  "taxas_adicionais": 60,
  "desconto": 0,
  "forma_pagamento": "pix",
  "status_pagamento": "parcial",
  "valor_pago": 400,
  "origem": "WhatsApp",
  "observacoes_internas": "Enviar mapa um dia antes",
  "preferencias_hospede": "Quarto silencioso",
  "status": "confirmada",
  "combos": [
    {
      "combo_definition_id": "combo-uuid",
      "quantidade": 1,
      "preco_unitario": 320,
      "valor_total": 320,
      "status": "agendado",
      "data_agendada": "2026-05-13T10:00:00",
      "observacoes": "Levar protetor solar"
    }
  ]
}
```

## Exemplo de resposta

```json
{
  "id": "reservation-uuid",
  "codigo_reserva": "RES-20260508-A1B2",
  "hospede_nome": "Marina Costa",
  "quarto_numero": "101",
  "status": "confirmada",
  "status_pagamento": "parcial",
  "valor_total": 1340,
  "saldo_pendente": 940,
  "combos": [
    {
      "id": "reservation-combo-uuid",
      "combo_nome": "Passeio de Barco Premium",
      "status": "agendado",
      "valor_total": 320
    }
  ],
  "pagamentos": [
    {
      "forma_pagamento": "pix",
      "valor": 400,
      "status": "pago"
    }
  ]
}
```

## Migrations

- `database/migrations/2026-05-08_reservations_combos.sql`

Tabelas novas:

- `reservation_guests`
- `combo_definitions`
- `combo_definition_items`
- `reservation_combo_items`
- `stock_movements`
- `reservation_payments`

Campos estendidos:

- `reservas`
- `produtos`

## Arquivos principais

- `backend/src/modules/reservations/reservations-repository.js`
- `backend/src/modules/reservations/reservations-service.js`
- `backend/src/modules/reservations/reservations-controller.js`
- `backend/src/modules/reservations/reservations-routes.js`
- `backend/src/modules/reservations/combos-routes.js`
- `frontend/src/features/reservations/ReservationsPage.jsx`
- `frontend/src/features/reservations/ReservationDrawer.jsx`
- `frontend/src/features/reservations/ReservationCalendar.jsx`
- `frontend/src/features/reservations/QuickGuestModal.jsx`
- `frontend/src/features/reservations/ComboDefinitionModal.jsx`
- `frontend/src/services/api.js`
