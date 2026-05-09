import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";

const router = Router();

const amenitySchema = z.object({
  nome: z.string().trim().min(1).max(120),
  icone: z.string().trim().max(80).nullable().optional(),
  ativo: z.boolean().optional()
});

async function listAmenities({ includeInactive = false } = {}) {
  const result = await query(
    `SELECT id, nome, icone, ativo, created_at
     FROM comodidades
     ${includeInactive ? "" : "WHERE ativo = true"}
     ORDER BY nome`
  );

  return result.rows;
}

router.get("/", authorizePermission("rooms.read"), async (request, response) => {
  const includeInactive = request.query.include_inactive === "true";
  return response.json(await listAmenities({ includeInactive }));
});

router.post("/", authorizePermission("rooms.manage"), auditAction("create", "comodidades_quarto"), async (request, response) => {
  const data = amenitySchema.pick({ nome: true, icone: true }).parse(request.body);

  const existing = await query(
    `SELECT id, nome, icone, ativo, created_at
     FROM comodidades
     WHERE LOWER(nome) = LOWER($1)
     LIMIT 1`,
    [data.nome]
  );

  if (existing.rows.length) {
    const amenity = existing.rows[0];

    if (amenity.ativo) {
      return response.status(200).json(amenity);
    }

    const restored = await query(
      `UPDATE comodidades
       SET nome = $2,
           icone = $3,
           ativo = true
       WHERE id = $1
       RETURNING id, nome, icone, ativo, created_at`,
      [amenity.id, data.nome, data.icone ?? amenity.icone ?? null]
    );

    return response.status(200).json(restored.rows[0]);
  }

  const result = await query(
    `INSERT INTO comodidades (nome, icone, ativo)
     VALUES ($1, $2, true)
     RETURNING id, nome, icone, ativo, created_at`,
    [data.nome, data.icone ?? null]
  );

  return response.status(201).json(result.rows[0]);
});

router.put("/:id", authorizePermission("rooms.manage"), auditAction("update", "comodidades_quarto"), async (request, response) => {
  const data = amenitySchema.parse(request.body);

  const duplicate = await query(
    `SELECT id
     FROM comodidades
     WHERE LOWER(nome) = LOWER($1)
       AND id <> $2
     LIMIT 1`,
    [data.nome, request.params.id]
  );

  if (duplicate.rows.length) {
    throw new AppError("Ja existe uma comodidade com este nome.", 409);
  }

  const result = await query(
    `UPDATE comodidades
     SET nome = $2,
         icone = $3,
         ativo = $4
     WHERE id = $1
     RETURNING id, nome, icone, ativo, created_at`,
    [
      request.params.id,
      data.nome,
      data.icone ?? null,
      data.ativo ?? true
    ]
  );

  if (!result.rows.length) {
    throw new AppError("Comodidade nao encontrada.", 404);
  }

  return response.json(result.rows[0]);
});

router.delete("/:id", authorizePermission("rooms.manage"), auditAction("delete", "comodidades_quarto"), async (request, response) => {
  const result = await query(
    `UPDATE comodidades
     SET ativo = false
     WHERE id = $1
     RETURNING id`,
    [request.params.id]
  );

  if (!result.rows.length) {
    throw new AppError("Comodidade nao encontrada.", 404);
  }

  return response.status(204).send();
});

export { router as roomAmenitiesRoutes };
