import { AuditService } from "../services/audit-service.js";

const auditService = new AuditService();

export function auditAction(action, entity) {
  return async (request, response, next) => {
    response.on("finish", async () => {
      if (response.statusCode < 400) {
        await auditService.log({
          action,
          entity,
          entityId: request.params.id || request.body.id || null,
          actorId: request.user?.id || null,
          payload: {
            params: request.params,
            body: request.body
          }
        });
      }
    });

    next();
  };
}
