import { Router } from "express";
import { query } from "../../config/database.js";

const router = Router();

router.get("/", async (request, response) => {
  const [rooms, revenue, operations, alerts] = await Promise.all([
    query(
      `SELECT status, COUNT(*)::int AS total
       FROM quartos
       GROUP BY status`
    ),
    query(
      `SELECT COALESCE(SUM(valor), 0) AS receita_dia
       FROM financeiro
       WHERE tipo = 'receita' AND DATE(data_lancamento) = CURRENT_DATE`
    ),
    query(
      `SELECT
         SUM(CASE WHEN DATE(data_checkin) = CURRENT_DATE THEN 1 ELSE 0 END)::int AS checkins_hoje,
         SUM(CASE WHEN DATE(data_checkout) = CURRENT_DATE THEN 1 ELSE 0 END)::int AS checkouts_hoje
       FROM reservas`
    ),
    query(
      `SELECT id, tipo, mensagem, severidade
       FROM alertas_sistema
       WHERE resolvido = false
       ORDER BY created_at DESC
       LIMIT 10`
    )
  ]);

  return response.json({
    roomStatus: rooms.rows,
    receitaDia: Number(revenue.rows[0].receita_dia),
    operacao: operations.rows[0],
    alertas: alerts.rows
  });
});

export { router as dashboardRoutes };
