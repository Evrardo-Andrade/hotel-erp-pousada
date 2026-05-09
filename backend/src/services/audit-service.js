import { query } from "../config/database.js";

export class AuditService {
  async log({ action, entity, entityId, actorId, payload }) {
    await query(
      `INSERT INTO logs (tipo, entidade, entidade_id, usuario_id, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [action, entity, entityId, actorId, JSON.stringify(payload || {})]
    );
  }
}
