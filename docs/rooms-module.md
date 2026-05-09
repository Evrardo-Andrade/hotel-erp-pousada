# Evolucao do Modulo de Quartos

## Observacao sobre banco

O pedido menciona MySQL, mas o projeto atual desta base usa PostgreSQL em schema, queries e tipos. A implementacao abaixo foi feita de forma consistente com o repositorio real.

## Migration

Arquivo:

- `database/migrations/2026-05-08_rooms_description_amenities.sql`

Responsabilidades:

- adicionar coluna `descricao` em `quartos`
- garantir as comodidades padrao

## Payload de criacao e edicao

`POST /api/rooms`

```json
{
  "numero": "305",
  "tipo_acomodacao_id": "3b6604ee-bf0f-4d88-aed0-0e6db8a070d6",
  "tipo_quarto_id": "f315fbb1-8d65-4d5a-86d7-f1d5156c29ae",
  "capacidade": 3,
  "andar": 3,
  "descricao": "Suite premium com varanda e vista para piscina.",
  "comodidade_ids": [
    "4feab77f-b640-4632-b0c6-44f6c855dc4b",
    "91b9fc3f-a663-4828-a5ec-15439db1c67f"
  ]
}
```

`PUT /api/rooms/:id`

Usa o mesmo payload do `POST`.

## Resposta da API

```json
{
  "id": "7b5df6fc-7c8b-4e2a-9f03-74b4300c0df1",
  "numero": "305",
  "tipo_acomodacao_id": "3b6604ee-bf0f-4d88-aed0-0e6db8a070d6",
  "tipo_quarto_id": "f315fbb1-8d65-4d5a-86d7-f1d5156c29ae",
  "andar": 3,
  "capacidade": 3,
  "status": "livre",
  "descricao": "Suite premium com varanda e vista para piscina.",
  "tipo_acomodacao": "Apartamento",
  "tipo_quarto": "Luxo",
  "comodidades": [
    {
      "id": "4feab77f-b640-4632-b0c6-44f6c855dc4b",
      "nome": "Ar Condicionado",
      "icone": "snowflake"
    },
    {
      "id": "91b9fc3f-a663-4828-a5ec-15439db1c67f",
      "nome": "Varanda",
      "icone": "home"
    }
  ]
}
```

## Metadata para o formulario

`GET /api/rooms/metadata`

Retorna:

- `tiposAcomodacao`
- `tiposQuarto`
- `comodidades`

## Compatibilidade

- quartos antigos sem `descricao` continuam funcionando
- quartos antigos sem relacao em `quartos_comodidades` retornam `comodidades: []`
- frontend faz fallback para `observacoes` quando necessario
