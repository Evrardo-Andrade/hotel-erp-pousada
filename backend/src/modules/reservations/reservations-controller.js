import { ReservationsService } from "./reservations-service.js";

const service = new ReservationsService();

export class ReservationsController {
  async list(request, response) {
    return response.json(await service.listReservations());
  }

  async details(request, response) {
    return response.json(await service.getReservation(request.params.id));
  }

  async metadata(request, response) {
    return response.json(await service.getMetadata());
  }

  async availability(request, response) {
    return response.json(await service.getAvailability(request.query));
  }

  async create(request, response) {
    return response.status(201).json(await service.createReservation(request.body));
  }

  async update(request, response) {
    return response.json(await service.updateReservation(request.params.id, request.body));
  }

  async updateStatus(request, response) {
    return response.json(await service.updateStatus(request.params.id, request.body.status));
  }

  async remove(request, response) {
    await service.deleteReservation(request.params.id);
    return response.status(204).send();
  }

  async listCombos(request, response) {
    return response.json(await service.listCombos());
  }

  async createCombo(request, response) {
    return response.status(201).json(await service.createCombo(request.body));
  }

  async updateCombo(request, response) {
    return response.json(await service.updateCombo(request.params.id, request.body));
  }

  async deleteCombo(request, response) {
    await service.deleteCombo(request.params.id);
    return response.status(204).send();
  }

  async addCombo(request, response) {
    return response.status(201).json(await service.addCombo(request.params.id, request.body));
  }

  async executeCombo(request, response) {
    return response.json(
      await service.executeCombo(request.params.id, request.body.reservation_combo_item_id, request.user?.id)
    );
  }

  async consumption(request, response) {
    return response.json(await service.getConsumption(request.params.id));
  }
}
