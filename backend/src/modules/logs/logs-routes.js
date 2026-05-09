import { Router } from "express";
import { query } from "../../config/database.js";
import { authorizePermission } from "../../middleware/auth.js";

const router = Router();

router.get("/", authorizePermission("logs.read"), async (request, response) => {
  const result = await query(
    `SELECT id, tipo, entidade, entidade_id, usuario_id, payload, created_at
     FROM logs
     ORDER BY created_at DESC
     LIMIT 100`
  );

  return response.json(result.rows);
});

export { router as logsRoutes };
