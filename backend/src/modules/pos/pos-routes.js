import { Router } from "express";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { PosController } from "./pos-controller.js";
import {
  cancelSaleSchema,
  cashMovementSchema,
  closeCashSessionSchema,
  openCashSessionSchema,
  refundSchema,
  roomServiceSchema,
  roomServiceStatusSchema,
  saleSchema
} from "./pos-validations.js";

const controller = new PosController();
const router = Router();

router.get("/overview", authorizePermission("pos.read"), controller.overview.bind(controller));
router.get("/reports", authorizePermission("pos.read", "finance.read"), controller.reports.bind(controller));
router.get("/sales", authorizePermission("pos.read"), controller.listSales.bind(controller));
router.get("/sales/:id", authorizePermission("pos.read"), controller.saleDetails.bind(controller));
router.get("/cash-register/current", authorizePermission("pos.read"), controller.currentCashSession.bind(controller));
router.get("/current", authorizePermission("pos.read"), controller.currentCashSession.bind(controller));

router.post("/cash-session/open", authorizePermission("pos.manage"), auditAction("open_cash_session", "cash_register_sessions"), async (request, response) => {
  request.body = openCashSessionSchema.parse(request.body);
  return controller.openCashSession(request, response);
});

router.post("/cash-register/open", authorizePermission("pos.manage"), auditAction("open_cash_session", "cash_register_sessions"), async (request, response) => {
  request.body = openCashSessionSchema.parse(request.body);
  return controller.openCashSession(request, response);
});

router.post("/cash-session/:sessionId/supply", authorizePermission("pos.manage", "finance.manage"), auditAction("cash_supply", "cash_movements"), async (request, response) => {
  request.body = cashMovementSchema.parse(request.body);
  return controller.supplyCash(request, response);
});

router.post("/cash-register/supply", authorizePermission("pos.manage", "finance.manage"), auditAction("cash_supply", "cash_movements"), async (request, response) => {
  const currentSession = await controller.service.currentCashSession({ user: request.user });
  request.params.sessionId = currentSession?.id;
  request.body = cashMovementSchema.parse(request.body);
  return controller.supplyCash(request, response);
});

router.post("/cash-session/:sessionId/withdraw", authorizePermission("pos.manage", "finance.manage"), auditAction("cash_withdraw", "cash_movements"), async (request, response) => {
  request.body = cashMovementSchema.parse(request.body);
  return controller.withdrawCash(request, response);
});

router.post("/cash-register/withdraw", authorizePermission("pos.manage", "finance.manage"), auditAction("cash_withdraw", "cash_movements"), async (request, response) => {
  const currentSession = await controller.service.currentCashSession({ user: request.user });
  request.params.sessionId = currentSession?.id;
  request.body = cashMovementSchema.parse(request.body);
  return controller.withdrawCash(request, response);
});

router.post("/cash-session/:sessionId/close", authorizePermission("pos.manage", "finance.manage"), auditAction("close_cash_session", "cash_register_sessions"), async (request, response) => {
  request.body = closeCashSessionSchema.parse(request.body);
  return controller.closeCashSession(request, response);
});

router.post("/cash-register/close", authorizePermission("pos.manage", "finance.manage"), auditAction("close_cash_session", "cash_register_sessions"), async (request, response) => {
  const currentSession = await controller.service.currentCashSession({ user: request.user });
  request.params.sessionId = currentSession?.id;
  request.body = closeCashSessionSchema.parse(request.body);
  return controller.closeCashSession(request, response);
});

router.post("/sales", authorizePermission("pos.manage"), auditAction("create", "vendas"), async (request, response) => {
  request.body = saleSchema.parse(request.body);
  return controller.createSale(request, response);
});

router.post("/sales/:id/cancel", authorizePermission("pos.manage"), auditAction("cancel", "vendas"), async (request, response) => {
  request.body = cancelSaleSchema.parse(request.body);
  return controller.cancelSale(request, response);
});

router.post("/sales/:id/refund", authorizePermission("pos.manage"), auditAction("refund", "refunds"), async (request, response) => {
  request.body = refundSchema.parse(request.body);
  return controller.refundSale(request, response);
});

router.post("/sales/:id/fiscal/:type", authorizePermission("fiscal.emit"), auditAction("emit_fiscal", "documentos_fiscais"), controller.emitSaleDocument.bind(controller));
router.get("/fiscal/:documentId/reprint", authorizePermission("fiscal.emit"), controller.reprintDocument.bind(controller));

router.post("/room-service", authorizePermission("pos.manage", "orders.manage"), auditAction("create_room_service", "pedidos"), async (request, response) => {
  request.body = roomServiceSchema.parse(request.body);
  return controller.createRoomService(request, response);
});

router.patch("/room-service/:id/status", authorizePermission("pos.manage", "orders.manage"), auditAction("update_room_service", "pedidos"), async (request, response) => {
  request.body = roomServiceStatusSchema.parse(request.body);
  return controller.updateRoomServiceStatus(request, response);
});

export { router as posRoutes };
