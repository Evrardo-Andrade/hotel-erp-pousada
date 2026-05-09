import { Router } from "express";
import { z } from "zod";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { FiscalService } from "../../services/fiscal-service.js";

const router = Router();
const fiscalService = new FiscalService();

router.get("/documents/:id", authorizePermission("fiscal.emit"), async (request, response) => {
  const result = await fiscalService.findDocument(request.params.id);
  return response.json(result);
});

router.post("/documents/cancel", authorizePermission("fiscal.cancel"), auditAction("cancel", "documentos_fiscais"), async (request, response) => {
  const schema = z.object({
    referenceType: z.string(),
    referenceId: z.string().uuid(),
    reason: z.string().min(5)
  });

  const data = schema.parse(request.body);
  const result = await fiscalService.cancelDocument(data);
  return response.json(result);
});

export { router as fiscalRoutes };
