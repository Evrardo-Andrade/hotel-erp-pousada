import { PosService } from "./pos-service.js";

export class PosController {
  constructor() {
    this.service = new PosService();
  }

  async overview(request, response) {
    return response.json(await this.service.overview());
  }

  async currentCashSession(request, response) {
    return response.json(await this.service.currentCashSession({ user: request.user }));
  }

  async listSales(request, response) {
    return response.json(await this.service.listSales());
  }

  async saleDetails(request, response) {
    return response.json(await this.service.saleDetails(request.params.id));
  }

  async openCashSession(request, response) {
    return response.status(201).json(
      await this.service.openCashSession({
        user: request.user,
        data: request.body
      })
    );
  }

  async supplyCash(request, response) {
    return response.status(201).json(
      await this.service.registerCashMovement({
        sessionId: request.params.sessionId,
        user: request.user,
        data: request.body,
        type: "suprimento"
      })
    );
  }

  async withdrawCash(request, response) {
    return response.status(201).json(
      await this.service.registerCashMovement({
        sessionId: request.params.sessionId,
        user: request.user,
        data: request.body,
        type: "sangria"
      })
    );
  }

  async closeCashSession(request, response) {
    return response.json(
      await this.service.closeCashSession({
        sessionId: request.params.sessionId,
        data: request.body
      })
    );
  }

  async createSale(request, response) {
    return response.status(201).json(
      await this.service.createSale({
        user: request.user,
        data: request.body
      })
    );
  }

  async cancelSale(request, response) {
    return response.json(
      await this.service.cancelSale({
        saleId: request.params.id,
        user: request.user,
        data: request.body
      })
    );
  }

  async refundSale(request, response) {
    return response.status(201).json(
      await this.service.refundSale({
        saleId: request.params.id,
        user: request.user,
        data: request.body
      })
    );
  }

  async emitSaleDocument(request, response) {
    return response.json(
      await this.service.emitSaleDocument({
        saleId: request.params.id,
        type: request.params.type
      })
    );
  }

  async reprintDocument(request, response) {
    return response.json(await this.service.reprintDocument(request.params.documentId));
  }

  async createRoomService(request, response) {
    return response.status(201).json(
      await this.service.createRoomService({
        user: request.user,
        data: request.body
      })
    );
  }

  async updateRoomServiceStatus(request, response) {
    return response.json(
      await this.service.updateRoomServiceStatus(request.params.id, request.body)
    );
  }

  async reports(request, response) {
    return response.json(await this.service.reports());
  }
}
