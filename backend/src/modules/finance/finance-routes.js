import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/database.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { FinanceService } from "../../services/finance-service.js";

const financeService = new FinanceService();
const router = Router();

router.get("/summary", authorizePermission("finance.read"), async (request, response) => {
  return response.json(await financeService.listSummary());
});

router.post("/entries", authorizePermission("finance.manage"), auditAction("create", "financeiro"), async (request, response) => {
  const schema = z.object({
    tipo: z.enum(["receita", "despesa"]),
    categoria: z.string().min(2),
    descricao: z.string().min(3),
    valor: z.number().positive(),
    dataLancamento: z.string()
  });

  const data = schema.parse(request.body);
  const entry = await financeService.createEntry({
    tipo: data.tipo,
    categoria: data.categoria,
    descricao: data.descricao,
    valor: data.valor,
    origem_modulo: "manual",
    origem_id: null,
    data_lancamento: data.dataLancamento
  });

  return response.status(201).json(entry);
});

router.get("/cashflow", authorizePermission("finance.read"), async (request, response) => {
  const result = await query(
    `SELECT DATE(data_lancamento) AS dia,
            SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) AS receitas,
            SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) AS despesas
     FROM financeiro
     GROUP BY DATE(data_lancamento)
     ORDER BY dia DESC
     LIMIT 30`
  );

  return response.json(result.rows);
});

export { router as financeRoutes };
