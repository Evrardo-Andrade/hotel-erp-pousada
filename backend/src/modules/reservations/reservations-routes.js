import { Router } from "express";
import { z } from "zod";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { ReservationsController } from "./reservations-controller.js";

const controller = new ReservationsController();
const router = Router();

const reservationSchema = z.object({
  hospede_id: z.string().uuid(),
  documento: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  codigo_reserva: z.string().optional(),
  data_checkin: z.string(),
  data_checkout: z.string(),
  quantidade_hospedes: z.number().int().positive().optional(),
  adultos: z.number().int().nonnegative(),
  criancas: z.number().int().nonnegative(),
  observacoes: z.string().optional(),
  tipo_acomodacao_id: z.string().uuid().optional(),
  tipo_quarto_id: z.string().uuid().optional(),
  quarto_id: z.string().uuid(),
  valor_diaria: z.number().nonnegative().optional().default(0),
  taxas_adicionais: z.number().nonnegative().default(0),
  desconto: z.number().nonnegative().default(0),
  forma_pagamento: z.string().optional(),
  status_pagamento: z.string().optional(),
  valor_pago: z.number().nonnegative().default(0),
  origem: z.string().default("WhatsApp"),
  observacoes_internas: z.string().optional(),
  preferencias_hospede: z.string().optional(),
  status: z.enum([
    "pre_reserva",
    "pendente",
    "confirmada",
    "checkin_realizado",
    "hospedado",
    "checkout_realizado",
    "cancelada",
    "no_show"
  ]).default("pendente"),
  combos: z.array(
    z.object({
      combo_definition_id: z.string().uuid(),
      quantidade: z.number().positive(),
      preco_unitario: z.number().nonnegative(),
      valor_total: z.number().nonnegative(),
      status: z.string().optional(),
      data_agendada: z.string().optional().nullable(),
      observacoes: z.string().optional()
    })
  ).default([])
});

const comboSchema = z.object({
  nome: z.string().min(3),
  descricao: z.string().optional(),
  preco: z.number().nonnegative(),
  duracao_minutos: z.number().int().positive(),
  ativo: z.boolean().default(true),
  limite_por_dia: z.number().int().positive(),
  observacoes: z.string().optional(),
  itens: z.array(
    z.object({
      produto_id: z.string().uuid(),
      quantidade: z.number().positive()
    })
  ).min(1)
});

router.get("/metadata", authorizePermission("reservations.read"), controller.metadata.bind(controller));
router.get("/availability", authorizePermission("reservations.read"), async (request, response) => {
  request.query = z.object({
    checkin: z.string(),
    checkout: z.string(),
    tipoAcomodacaoId: z.string().optional(),
    tipoQuartoId: z.string().optional(),
    ignoreReservationId: z.string().optional()
  }).parse(request.query);
  return controller.availability(request, response);
});
router.get("/", authorizePermission("reservations.read"), controller.list.bind(controller));
router.post("/", authorizePermission("reservations.manage"), auditAction("create", "reservas"), async (request, response) => {
  request.body = reservationSchema.parse(request.body);
  return controller.create(request, response);
});
router.put("/:id", authorizePermission("reservations.manage"), auditAction("update", "reservas"), async (request, response) => {
  request.body = reservationSchema.parse(request.body);
  return controller.update(request, response);
});
router.patch("/:id/status", authorizePermission("reservations.manage"), auditAction("update_status", "reservas"), async (request, response) => {
  request.body = z.object({
    status: reservationSchema.shape.status
  }).parse(request.body);
  return controller.updateStatus(request, response);
});
router.post("/:id/add-combo", authorizePermission("reservations.manage"), auditAction("add_combo", "reservation_combo_items"), async (request, response) => {
  request.body = z.object({
    combo_definition_id: z.string().uuid(),
    quantidade: z.number().positive(),
    preco_unitario: z.number().nonnegative().optional(),
    valor_total: z.number().nonnegative().optional(),
    status: z.string().optional(),
    data_agendada: z.string().nullable().optional(),
    observacoes: z.string().optional()
  }).parse(request.body);
  return controller.addCombo(request, response);
});
router.post("/:id/execute-combo", authorizePermission("reservations.manage"), auditAction("execute_combo", "stock_movements"), async (request, response) => {
  request.body = z.object({
    reservation_combo_item_id: z.string().uuid()
  }).parse(request.body);
  return controller.executeCombo(request, response);
});
router.get("/:id/consumption", authorizePermission("reservations.read"), controller.consumption.bind(controller));
router.get("/:id", authorizePermission("reservations.read"), controller.details.bind(controller));
router.delete("/:id", authorizePermission("reservations.manage"), auditAction("delete", "reservas"), controller.remove.bind(controller));

export { router as reservationsRoutes, comboSchema, controller as reservationsController };
