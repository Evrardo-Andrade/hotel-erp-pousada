import { Router } from "express";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { reservationsController, comboSchema } from "./reservations-routes.js";

const router = Router();

router.get("/", authorizePermission("reservations.read"), reservationsController.listCombos.bind(reservationsController));
router.post("/", authorizePermission("reservations.manage"), auditAction("create", "combo_definitions"), async (request, response) => {
  request.body = comboSchema.parse(request.body);
  return reservationsController.createCombo(request, response);
});
router.put("/:id", authorizePermission("reservations.manage"), auditAction("update", "combo_definitions"), async (request, response) => {
  request.body = comboSchema.parse(request.body);
  return reservationsController.updateCombo(request, response);
});
router.delete("/:id", authorizePermission("reservations.manage"), auditAction("delete", "combo_definitions"), reservationsController.deleteCombo.bind(reservationsController));

export { router as combosRoutes };
