import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";

const router = Router();

const typeSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  descricao: z.string().trim().max(400).nullable().optional(),
  ativo: z.boolean().optional()
});

async function ensureUniqueName(nome, currentId = null) {
  const result = await query(
    `SELECT id
     FROM tipos_acomodacao
     WHERE LOWER(nome) = LOWER($1)
       ${currentId ? "AND id <> $2" : ""}
     LIMIT 1`,
    currentId ? [nome, currentId] : [nome]
  );

  if (result.rows.length) {
    throw new AppError("Ja existe um tipo de acomodacao com este nome.", 409);
  }
}

router.get("/", authorizePermission("rooms.read"), async (request, response) => {
  const includeInactive = request.query.include_inactive !== "false";
  const result = await query(
    `SELECT id, nome, descricao, ativo, created_at, updated_at
     FROM tipos_acomodacao
     ${includeInactive ? "" : "WHERE ativo = true"}
     ORDER BY ativo DESC, nome`
  );

  return response.json(result.rows);
});

router.post("/", authorizePermission("rooms.manage"), auditAction("create", "tipos_acomodacao"), async (request, response) => {
  const data = typeSchema.pick({ nome: true, descricao: true }).parse(request.body);
  const existing = await query(
    `SELECT id, nome, descricao, ativo, created_at, updated_at
     FROM tipos_acomodacao
     WHERE LOWER(nome) = LOWER($1)
     LIMIT 1`,
    [data.nome]
  );

  if (existing.rows.length) {
    const current = existing.rows[0];

    if (current.ativo) {
      return response.json(current);
    }

    const restored = await query(
      `UPDATE tipos_acomodacao
       SET nome = $2,
           descricao = $3,
           ativo = true,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, nome, descricao, ativo, created_at, updated_at`,
      [current.id, data.nome, data.descricao || null]
    );

    return response.status(200).json(restored.rows[0]);
  }

  const result = await query(
    `INSERT INTO tipos_acomodacao (nome, descricao, ativo)
     VALUES ($1, $2, true)
     RETURNING id, nome, descricao, ativo, created_at, updated_at`,
    [data.nome, data.descricao || null]
  );

  return response.status(201).json(result.rows[0]);
});

router.put("/:id", authorizePermission("rooms.manage"), auditAction("update", "tipos_acomodacao"), async (request, response) => {
  const data = typeSchema.parse(request.body);
  await ensureUniqueName(data.nome, request.params.id);

  const result = await query(
    `UPDATE tipos_acomodacao
     SET nome = $2,
         descricao = $3,
         ativo = $4,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, nome, descricao, ativo, created_at, updated_at`,
    [request.params.id, data.nome, data.descricao || null, data.ativo ?? true]
  );

  if (!result.rows.length) {
    throw new AppError("Tipo de acomodacao nao encontrado.", 404);
  }

  return response.json(result.rows[0]);
});

router.patch("/:id/active", authorizePermission("rooms.manage"), auditAction("update_active", "tipos_acomodacao"), async (request, response) => {
  const schema = z.object({ ativo: z.boolean() });
  const { ativo } = schema.parse(request.body);

  const result = await query(
    `UPDATE tipos_acomodacao
     SET ativo = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, nome, descricao, ativo, created_at, updated_at`,
    [request.params.id, ativo]
  );

  if (!result.rows.length) {
    throw new AppError("Tipo de acomodacao nao encontrado.", 404);
  }

  return response.json(result.rows[0]);
});

router.delete("/:id", authorizePermission("rooms.manage"), auditAction("delete", "tipos_acomodacao"), async (request, response) => {
  const usage = await query(
    `SELECT id
     FROM quartos
     WHERE tipo_acomodacao_id = $1
     LIMIT 1`,
    [request.params.id]
  );

  if (usage.rows.length) {
    throw new AppError("Nao e possivel excluir um tipo de acomodacao em uso.", 409);
  }

  const result = await query(
    `DELETE FROM tipos_acomodacao
     WHERE id = $1
     RETURNING id`,
    [request.params.id]
  );

  if (!result.rows.length) {
    throw new AppError("Tipo de acomodacao nao encontrado.", 404);
  }

  return response.status(204).send();
});

export { router as roomAccommodationTypesRoutes };
