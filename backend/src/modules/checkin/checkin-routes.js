import { Router } from "express";
import QRCode from "qrcode";
import { z } from "zod";
import { query, withTransaction } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { broadcastGuestAccount, broadcastRoomStatus } from "../../services/room-service-events.js";
import { FiscalService } from "../../services/fiscal-service.js";

const fiscalService = new FiscalService();
const router = Router();

router.post("/check-in", authorizePermission("stay.manage"), auditAction("checkin", "contas_hospedagem"), async (request, response) => {
  const schema = z.object({
    reservaId: z.string().uuid()
  });

  const { reservaId } = schema.parse(request.body);

  const result = await withTransaction(async (client) => {
    const reservationResult = await client.query(
      `SELECT r.*, h.id AS hospede_id, q.id AS quarto_id
       FROM reservas r
       JOIN hospedes h ON h.id = r.hospede_id
       JOIN quartos q ON q.id = r.quarto_id
       WHERE r.id = $1`,
      [reservaId]
    );

    const reservation = reservationResult.rows[0];

    if (!reservation) {
      throw new AppError("Reserva nao encontrada.", 404);
    }

    await client.query(
      `UPDATE reservas SET status = 'checkin_realizado', updated_at = NOW()
       WHERE id = $1`,
      [reservaId]
    );

    await client.query(
      `UPDATE quartos SET status = 'ocupado', updated_at = NOW()
       WHERE id = $1`,
      [reservation.quarto_id]
    );

    const accountResult = await client.query(
      `INSERT INTO contas_hospedagem (
        reserva_id, hospede_id, quarto_id, status, saldo_atual
      ) VALUES ($1, $2, $3, 'aberta', 0)
      RETURNING *`,
      [reservaId, reservation.hospede_id, reservation.quarto_id]
    );

    return {
      reservation,
      account: accountResult.rows[0]
    };
  });

  const appLink = `${request.protocol}://${request.get("host")}/guest/${result.account.id}`;
  const qrCode = await QRCode.toDataURL(appLink);

  broadcastRoomStatus({ kind: "checkin", roomId: result.account.quarto_id });
  broadcastGuestAccount({ guestId: result.account.hospede_id, account: result.account });

  return response.status(201).json({
    conta: result.account,
    appLink,
    qrCode
  });
});

router.post("/check-out", authorizePermission("stay.manage", "fiscal.emit"), auditAction("checkout", "contas_hospedagem"), async (request, response) => {
  const schema = z.object({
    contaId: z.string().uuid()
  });

  const { contaId } = schema.parse(request.body);

  const result = await withTransaction(async (client) => {
    const accountResult = await client.query(
      `SELECT ch.*, r.id AS reserva_id, q.id AS quarto_id, h.id AS hospede_id
       FROM contas_hospedagem ch
       JOIN reservas r ON r.id = ch.reserva_id
       JOIN quartos q ON q.id = ch.quarto_id
       JOIN hospedes h ON h.id = ch.hospede_id
       WHERE ch.id = $1`,
      [contaId]
    );

    const account = accountResult.rows[0];

    if (!account) {
      throw new AppError("Conta de hospedagem nao encontrada.", 404);
    }

    await client.query(
      `UPDATE contas_hospedagem SET status = 'fechada', updated_at = NOW()
       WHERE id = $1`,
      [contaId]
    );

    await client.query(
      `UPDATE reservas SET status = 'checkout_realizado', updated_at = NOW()
       WHERE id = $1`,
      [account.reserva_id]
    );

    await client.query(
      `UPDATE quartos SET status = 'limpeza', updated_at = NOW()
       WHERE id = $1`,
      [account.quarto_id]
    );

    return account;
  });

  const documentoFiscal = await fiscalService.emitNfeCheckout({
    hospedagemId: result.id
  });

  broadcastRoomStatus({ kind: "checkout", roomId: result.quarto_id });

  return response.json({
    contaId: result.id,
    status: "fechada",
    documentoFiscal
  });
});

router.get("/guest/:accountId", authorizePermission("stay.manage"), async (request, response) => {
  const result = await query(
    `SELECT ch.*, h.nome AS hospede_nome, q.numero AS quarto_numero
     FROM contas_hospedagem ch
     JOIN hospedes h ON h.id = ch.hospede_id
     JOIN quartos q ON q.id = ch.quarto_id
     WHERE ch.id = $1`,
    [request.params.accountId]
  );

  if (!result.rows.length) {
    throw new AppError("Conta nao encontrada.", 404);
  }

  return response.json(result.rows[0]);
});

export { router as checkinRoutes };
