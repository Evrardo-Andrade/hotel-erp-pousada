import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../../config/database.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { broadcastOrderStatus } from "../../services/room-service-events.js";
import { AppError } from "../../utils/app-error.js";

const router = Router();

router.get("/", authorizePermission("orders.read"), async (request, response) => {
  const result = await query(
    `SELECT p.*, h.nome AS hospede_nome, q.numero AS quarto_numero
     FROM pedidos p
     JOIN hospedes h ON h.id = p.hospede_id
     JOIN quartos q ON q.id = p.quarto_id
     ORDER BY p.created_at DESC`
  );

  return response.json(result.rows);
});

router.post("/", authorizePermission("orders.manage"), auditAction("create", "pedidos"), async (request, response) => {
  const schema = z.object({
    hospedeId: z.string().uuid(),
    quartoId: z.string().uuid(),
    contaHospedagemId: z.string().uuid(),
    areaEntrega: z.string().min(2),
    itens: z.array(
      z.object({
        produtoId: z.string().uuid(),
        nome: z.string(),
        quantidade: z.number().positive(),
        precoUnitario: z.number().positive()
      })
    ).min(1)
  });

  const data = schema.parse(request.body);
  const order = await withTransaction(async (client) => {
    const total = data.itens.reduce(
      (sum, item) => sum + item.quantidade * item.precoUnitario,
      0
    );

    const orderResult = await client.query(
      `INSERT INTO pedidos (
        hospede_id, quarto_id, conta_hospedagem_id, area_entrega, valor_total, status
      ) VALUES ($1, $2, $3, $4, $5, 'novo')
      RETURNING *`,
      [data.hospedeId, data.quartoId, data.contaHospedagemId, data.areaEntrega, total]
    );

    for (const item of data.itens) {
      await client.query(
        `INSERT INTO itens_pedido (
          pedido_id, produto_id, nome_produto, quantidade, preco_unitario
        ) VALUES ($1, $2, $3, $4, $5)`,
        [orderResult.rows[0].id, item.produtoId, item.nome, item.quantidade, item.precoUnitario]
      );
    }

    await client.query(
      `UPDATE contas_hospedagem
       SET saldo_atual = saldo_atual + $2, updated_at = NOW()
       WHERE id = $1`,
      [data.contaHospedagemId, total]
    );

    return orderResult.rows[0];
  });

  broadcastOrderStatus({
    kind: "created",
    order,
    guestId: data.hospedeId
  });

  return response.status(201).json(order);
});

router.patch("/:id/status", authorizePermission("orders.manage"), auditAction("update_status", "pedidos"), async (request, response) => {
  const schema = z.object({
    status: z.enum(["novo", "em_preparo", "entregue"]),
    confirmadoPeloHospede: z.boolean().optional()
  });

  const data = schema.parse(request.body);
  const result = await query(
    `UPDATE pedidos
     SET status = $2,
         confirmado_pelo_hospede = COALESCE($3, confirmado_pelo_hospede),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [request.params.id, data.status, data.confirmadoPeloHospede]
  );

  if (!result.rows.length) {
    throw new AppError("Pedido nao encontrado.", 404);
  }

  broadcastOrderStatus({
    kind: "updated",
    order: result.rows[0],
    guestId: result.rows[0].hospede_id
  });

  return response.json(result.rows[0]);
});

export { router as ordersRoutes };
