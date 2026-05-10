import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/database.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { broadcastRoomStatus } from "../../services/room-service-events.js";

const router = Router();

function logRoomDebug(event, request, payload) {
  if (!env.debugRooms) {
    return;
  }

  console.info("[rooms]", event, {
    roomId: request.params.id || null,
    user: {
      id: request.user?.id || null,
      email: request.user?.email || null,
      role: request.user?.role || null
    },
    payload
  });
}

const roomSelect = `
  SELECT
    q.*,
    ta.nome AS tipo_acomodacao,
    tq.nome AS tipo_quarto,
    COALESCE(
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'id', c.id,
          'nome', c.nome,
          'icone', c.icone,
          'ativo', c.ativo
        )
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::json
    ) AS comodidades
  FROM quartos q
  JOIN tipos_acomodacao ta ON ta.id = q.tipo_acomodacao_id
  JOIN tipos_quarto tq ON tq.id = q.tipo_quarto_id
  LEFT JOIN quartos_comodidades qc ON qc.quarto_id = q.id
  LEFT JOIN comodidades c ON c.id = qc.comodidade_id
`;

async function listRoomDetails(whereClause = "", params = []) {
  const result = await query(
    `${roomSelect}
     ${whereClause}
     GROUP BY q.id, ta.nome, tq.nome
     ORDER BY q.numero`,
    params
  );

  return result.rows.map((room) => ({
    ...room,
    descricao: room.descricao || room.observacoes || null,
    comodidades: room.comodidades || []
  }));
}

async function syncRoomAmenities(roomId, amenityIds = []) {
  await query(`DELETE FROM quartos_comodidades WHERE quarto_id = $1`, [roomId]);

  if (!amenityIds.length) {
    return;
  }

  const validAmenities = await query(
    `SELECT id
     FROM comodidades
     WHERE ativo = true
       AND id = ANY($1::uuid[])`,
    [Array.from(new Set(amenityIds))]
  );

  for (const amenityId of validAmenities.rows.map((item) => item.id)) {
    await query(
      `INSERT INTO quartos_comodidades (quarto_id, comodidade_id)
       VALUES ($1, $2)`,
      [roomId, amenityId]
    );
  }
}

router.get("/metadata", authorizePermission("rooms.read"), async (request, response) => {
  const [accommodationTypes, roomTypes, amenities] = await Promise.all([
    query(`SELECT id, nome, descricao, ativo FROM tipos_acomodacao ORDER BY ativo DESC, nome`),
    query(`SELECT id, nome, descricao, diaria_base, ativo FROM tipos_quarto ORDER BY ativo DESC, nome`),
    query(`SELECT id, nome, icone, ativo FROM comodidades WHERE ativo = true ORDER BY nome`)
  ]);

  return response.json({
    tiposAcomodacao: accommodationTypes.rows,
    tiposQuarto: roomTypes.rows,
    comodidades: amenities.rows
  });
});

router.get("/", authorizePermission("rooms.read"), async (request, response) => {
  const status = request.query.status ? String(request.query.status) : "";

  if (status) {
    const allowedStatus = ["livre", "ocupado", "limpeza", "manutencao", "bloqueado"];
    if (!allowedStatus.includes(status)) {
      throw new AppError("Status de quarto invalido.", 400);
    }

    return response.json(await listRoomDetails("WHERE q.status = $1", [status]));
  }

  return response.json(await listRoomDetails());
});

router.post("/", authorizePermission("rooms.manage"), auditAction("create", "quartos"), async (request, response) => {
  const schema = z.object({
    numero: z.string().min(1),
    tipo_acomodacao_id: z.string().uuid(),
    tipo_quarto_id: z.string().uuid(),
    status: z.enum(["livre", "ocupado", "limpeza", "manutencao", "bloqueado"]).optional(),
    capacidade: z.number().int().positive(),
    andar: z.number().int().nullable().optional(),
    descricao: z.string().max(1200).nullable().optional(),
    comodidade_ids: z.array(z.string().uuid()).default([])
  });

  const data = schema.parse(request.body);

  const result = await query(
    `INSERT INTO quartos (
      numero, tipo_acomodacao_id, tipo_quarto_id, capacidade, andar, descricao, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      data.numero,
      data.tipo_acomodacao_id,
      data.tipo_quarto_id,
      data.capacidade,
      data.andar ?? null,
      data.descricao || null,
      data.status || "livre"
    ]
  );

  await syncRoomAmenities(result.rows[0].id, data.comodidade_ids);
  const [fullRoom] = await listRoomDetails("WHERE q.id = $1", [result.rows[0].id]);

  broadcastRoomStatus({ kind: "created", room: fullRoom });

  return response.status(201).json(fullRoom);
});

router.post("/bulk-generate", authorizePermission("rooms.manage"), auditAction("bulk_generate", "quartos"), async (request, response) => {
  const schema = z.object({
    quantidade: z.number().int().positive(),
    numeroInicial: z.number().int().positive(),
    tipoAcomodacaoId: z.string().uuid(),
    tipoQuartoId: z.string().uuid(),
    andar: z.number().int().optional(),
    capacidade: z.number().int().positive()
  });

  const data = schema.parse(request.body);
  const created = [];

  for (let index = 0; index < data.quantidade; index += 1) {
    const roomNumber = String(data.numeroInicial + index);
    const result = await query(
      `INSERT INTO quartos (
        numero, tipo_acomodacao_id, tipo_quarto_id, andar, capacidade, status
      ) VALUES ($1, $2, $3, $4, $5, 'livre')
      RETURNING *`,
      [
        roomNumber,
        data.tipoAcomodacaoId,
        data.tipoQuartoId,
        data.andar || null,
        data.capacidade
      ]
    );
    created.push(result.rows[0]);
  }

  broadcastRoomStatus({ kind: "bulk-create", rooms: created });

  return response.status(201).json(created);
});

router.put("/:id", authorizePermission("rooms.manage"), auditAction("update", "quartos"), async (request, response) => {
  const schema = z.object({
    numero: z.string().min(1),
    tipo_acomodacao_id: z.string().uuid(),
    tipo_quarto_id: z.string().uuid(),
    status: z.enum(["livre", "ocupado", "limpeza", "manutencao", "bloqueado"]).optional(),
    capacidade: z.number().int().positive(),
    andar: z.number().int().nullable().optional(),
    descricao: z.string().max(1200).nullable().optional(),
    comodidade_ids: z.array(z.string().uuid()).default([])
  });

  const data = schema.parse(request.body);
  logRoomDebug("update-request", request, {
    numero: data.numero,
    status: data.status || "livre",
    capacidade: data.capacidade,
    andar: data.andar ?? null,
    tipo_acomodacao_id: data.tipo_acomodacao_id,
    tipo_quarto_id: data.tipo_quarto_id,
    descricaoLength: data.descricao?.length || 0,
    comodidade_ids: data.comodidade_ids
  });

  const result = await query(
    `UPDATE quartos
     SET numero = $2,
         tipo_acomodacao_id = $3,
         tipo_quarto_id = $4,
         capacidade = $5,
         andar = $6,
         descricao = $7,
         status = $8,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      request.params.id,
      data.numero,
      data.tipo_acomodacao_id,
      data.tipo_quarto_id,
      data.capacidade,
      data.andar ?? null,
      data.descricao || null,
      data.status || "livre"
    ]
  );

  if (!result.rows.length) {
    throw new AppError("Quarto nao encontrado.", 404);
  }

  await syncRoomAmenities(request.params.id, data.comodidade_ids);
  const [fullRoom] = await listRoomDetails("WHERE q.id = $1", [request.params.id]);
  logRoomDebug("update-success", request, {
    persistedRoomId: request.params.id,
    status: fullRoom?.status || result.rows[0]?.status || null
  });

  broadcastRoomStatus({ kind: "updated", room: fullRoom });

  return response.json(fullRoom);
});

router.patch("/:id/status", authorizePermission("rooms.manage"), auditAction("update_status", "quartos"), async (request, response) => {
  const schema = z.object({
    status: z.enum(["livre", "ocupado", "limpeza", "manutencao", "bloqueado"])
  });

  const { status } = schema.parse(request.body);
  const result = await query(
    `UPDATE quartos SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [request.params.id, status]
  );

  if (!result.rows.length) {
    throw new AppError("Quarto nao encontrado.", 404);
  }

  const [fullRoom] = await listRoomDetails("WHERE q.id = $1", [request.params.id]);
  broadcastRoomStatus({ kind: "status-changed", room: fullRoom || result.rows[0] });

  return response.json(fullRoom || result.rows[0]);
});

router.delete("/:id", authorizePermission("rooms.manage"), auditAction("delete", "quartos"), async (request, response) => {
  const roomResult = await query(`SELECT * FROM quartos WHERE id = $1`, [request.params.id]);

  if (!roomResult.rows.length) {
    throw new AppError("Quarto nao encontrado.", 404);
  }

  const activeReservation = await query(
    `SELECT id
     FROM reservas
     WHERE quarto_id = $1
       AND status IN ('confirmada', 'checkin_realizado')
     LIMIT 1`,
    [request.params.id]
  );

  if (activeReservation.rows.length) {
    throw new AppError("Nao e possivel excluir quarto com reserva ativa.", 409);
  }

  await query(`DELETE FROM quartos WHERE id = $1`, [request.params.id]);

  broadcastRoomStatus({ kind: "deleted", roomId: request.params.id });

  return response.status(204).send();
});

export { router as roomsRoutes };
