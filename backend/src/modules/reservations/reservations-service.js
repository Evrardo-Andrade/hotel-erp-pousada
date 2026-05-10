import { FinanceService } from "../../services/finance-service.js";
import { AppError } from "../../utils/app-error.js";
import { ReservationsRepository } from "./reservations-repository.js";

function calculateNights(checkin, checkout) {
  const start = new Date(checkin);
  const end = new Date(checkout);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function toNumber(value) {
  return Number(value || 0);
}

function buildReservationCode() {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RES-${timestamp}-${random}`;
}

export class ReservationsService {
  constructor() {
    this.repository = new ReservationsRepository();
    this.financeService = new FinanceService();
  }

  async listReservations() {
    return this.repository.listReservations();
  }

  async getReservation(id) {
    const reservation = await this.repository.getReservationById(id);

    if (!reservation) {
      throw new AppError("Reserva nao encontrada.", 404);
    }

    return reservation;
  }

  async getMetadata() {
    return this.repository.listMetadata();
  }

  async getAvailability(filters) {
    return this.repository.findAvailableRooms(filters);
  }

  async listCombos() {
    return this.repository.listCombos();
  }

  async createCombo(payload) {
    return this.repository.createCombo(payload);
  }

  async updateCombo(id, payload) {
    const combo = await this.repository.updateCombo(id, payload);

    if (!combo) {
      throw new AppError("Combo nao encontrado.", 404);
    }

    return combo;
  }

  async deleteCombo(id) {
    const combo = await this.repository.deleteCombo(id);

    if (!combo) {
      throw new AppError("Combo nao encontrado.", 404);
    }
  }

  buildPayload(input, room) {
    const numero_diarias = calculateNights(input.data_checkin, input.data_checkout);
    const valor_diaria = toNumber(
      input.valor_diaria !== undefined && input.valor_diaria !== null
        ? input.valor_diaria
        : room.valor_diaria
    );
    const subtotal_hospedagem = numero_diarias * valor_diaria;
    const valor_total =
      subtotal_hospedagem +
      toNumber(input.taxas_adicionais) -
      toNumber(input.desconto) +
      (input.combos || []).reduce((sum, combo) => sum + toNumber(combo.valor_total), 0);
    const valor_pago = toNumber(input.valor_pago);
    const quantidade_hospedes = toNumber(input.quantidade_hospedes || input.adultos + input.criancas);

    if (quantidade_hospedes > Number(room.capacidade || 0)) {
      throw new AppError("Quantidade de hospedes excede a capacidade maxima do quarto.");
    }

    return {
      ...input,
      codigo_reserva: input.codigo_reserva || buildReservationCode(),
      quantidade_hospedes,
      numero_diarias,
      valor_diaria,
      subtotal_hospedagem,
      taxas_adicionais: toNumber(input.taxas_adicionais),
      desconto: toNumber(input.desconto),
      valor_total,
      valor_pago,
      saldo_pendente: valor_total - valor_pago,
      status_pagamento:
        valor_pago >= valor_total ? "pago" : valor_pago > 0 ? "parcial" : input.status_pagamento || "pendente"
    };
  }

  async createReservation(input) {
    const metadata = await this.repository.listMetadata();
    const room = metadata.quartos.find((item) => item.id === input.quarto_id);

    if (!room) {
      throw new AppError("Quarto nao encontrado.", 404);
    }

    const overlap = await this.repository.findOverlappingReservation({
      roomId: input.quarto_id,
      checkin: input.data_checkin,
      checkout: input.data_checkout
    });

    if (overlap) {
      throw new AppError("Quarto indisponivel para o periodo selecionado.");
    }

    const payload = this.buildPayload(input, room);
    const reservation = await this.repository.createReservation(payload);

    if (payload.valor_pago > 0) {
      await this.financeService.createEntry({
        tipo: "receita",
        categoria: "reserva",
        descricao: `Pagamento inicial reserva ${payload.codigo_reserva}`,
        valor: payload.valor_pago,
        origem_modulo: "reservations",
        origem_id: reservation.id,
        data_lancamento: new Date(),
        status: "liquidado"
      });
    }

    return reservation;
  }

  async updateReservation(id, input) {
    const metadata = await this.repository.listMetadata();
    const room = metadata.quartos.find((item) => item.id === input.quarto_id);

    if (!room) {
      throw new AppError("Quarto nao encontrado.", 404);
    }

    const overlap = await this.repository.findOverlappingReservation({
      roomId: input.quarto_id,
      checkin: input.data_checkin,
      checkout: input.data_checkout,
      ignoreReservationId: id
    });

    if (overlap) {
      throw new AppError("Quarto indisponivel para o periodo selecionado.");
    }

    const payload = this.buildPayload(input, room);
    const reservation = await this.repository.updateReservation(id, payload);

    if (!reservation) {
      throw new AppError("Reserva nao encontrada.", 404);
    }

    return reservation;
  }

  async updateStatus(id, status) {
    const reservation = await this.repository.updateReservationStatus(id, status);

    if (!reservation) {
      throw new AppError("Reserva nao encontrada.", 404);
    }

    return reservation;
  }

  async deleteReservation(id) {
    const deleted = await this.repository.deleteReservation(id);

    if (!deleted) {
      throw new AppError("Reserva nao encontrada.", 404);
    }
  }

  async addCombo(reservationId, input) {
    const combo = await this.repository.getComboById(input.combo_definition_id);

    if (!combo || !combo.ativo) {
      throw new AppError("Combo nao encontrado ou inativo.", 404);
    }

    const quantity = toNumber(input.quantidade || 1);
    const payload = {
      ...input,
      quantidade: quantity,
      preco_unitario: toNumber(input.preco_unitario || combo.preco),
      valor_total: quantity * toNumber(input.preco_unitario || combo.preco)
    };

    return this.repository.addComboToReservation(reservationId, payload);
  }

  async executeCombo(reservationId, reservationComboId, actorId) {
    const reservation = await this.getReservation(reservationId);
    const executed = await this.repository.executeReservationCombo({
      reservationId,
      reservationComboId,
      guestId: reservation.hospede_id,
      userId: actorId
    });

    if (!executed) {
      throw new AppError("Combo contratado nao encontrado.", 404);
    }

    return executed;
  }

  async getConsumption(reservationId) {
    await this.getReservation(reservationId);
    return this.repository.getReservationConsumption(reservationId);
  }
}
