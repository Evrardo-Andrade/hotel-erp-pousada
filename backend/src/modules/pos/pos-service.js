import crypto from "crypto";
import { withTransaction } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";
import { FinanceService } from "../../services/finance-service.js";
import { FiscalService } from "../../services/fiscal-service.js";
import { broadcastGuestAccount, broadcastOrderStatus } from "../../services/room-service-events.js";
import { PosRepository } from "./pos-repository.js";

function toNumber(value) {
  return Number(value || 0);
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function hashSupervisorSecret(secret) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export class PosService {
  constructor() {
    this.repository = new PosRepository();
    this.financeService = new FinanceService();
    this.fiscalService = new FiscalService();
  }

  async overview() {
    const data = await this.repository.getOverview();
    const reports = await this.reports();
    return { ...data, reports };
  }

  async currentCashSession({ user }) {
    if (user?.id) {
      const ownSession = await this.repository.getCurrentSessionByOperator(user.id);

      if (ownSession) {
        return ownSession;
      }
    }

    return this.repository.getAnyOpenSession();
  }

  async openCashSession({ user, data }) {
    const operatorId = data.operadorId || user?.id;

    if (!operatorId) {
      throw new AppError("Operador nao informado para abertura do caixa.", 422);
    }

    const currentSession = await this.repository.getCurrentSessionByOperator(operatorId);

    if (currentSession) {
      throw new AppError("Ja existe um caixa aberto para este operador.", 409);
    }

    return withTransaction(async (client) => {
      const session = await this.repository.createSession(
        {
          operadorId: operatorId,
          valorInicial: roundMoney(data.valorInicial),
          observacoes: data.observacoes
        },
        client
      );

      await this.repository.createCashMovement(
        {
          sessionId: session.id,
          tipo: "abertura",
          valor: roundMoney(data.valorInicial),
          motivo: "Abertura de caixa",
          operadorId,
          observacoes: data.observacoes
        },
        client
      );

      return session;
    });
  }

  async registerCashMovement({ sessionId, user, data, type }) {
    const session = await this.repository.getSessionById(sessionId);

    if (!session || session.status !== "aberto") {
      throw new AppError("Sessao de caixa nao encontrada ou ja fechada.", 404);
    }

    return this.repository.createCashMovement({
      sessionId,
      tipo: type,
      valor: roundMoney(data.valor),
      motivo: data.motivo,
      operadorId: data.operadorId || user?.id || session.operador_id,
      observacoes: data.observacoes
    });
  }

  async closeCashSession({ sessionId, data }) {
    const session = await this.repository.getSessionById(sessionId);

    if (!session || session.status !== "aberto") {
      throw new AppError("Sessao de caixa nao encontrada ou ja fechada.", 404);
    }

    const [movements, payments] = await Promise.all([
      this.repository.listSessionMovements(sessionId),
      this.repository.listSessionPayments(sessionId)
    ]);

    const totalsByMethod = payments.reduce((accumulator, item) => {
      accumulator[item.metodo] = roundMoney(item.total);
      return accumulator;
    }, {});

    const totalVendido = roundMoney(
      Object.values(totalsByMethod).reduce((sum, value) => sum + toNumber(value), 0)
    );

    const totalSuprimentos = roundMoney(
      movements
        .filter((movement) => movement.tipo === "suprimento")
        .reduce((sum, movement) => sum + toNumber(movement.valor), 0)
    );

    const totalSangrias = roundMoney(
      movements
        .filter((movement) => movement.tipo === "sangria")
        .reduce((sum, movement) => sum + toNumber(movement.valor), 0)
    );

    const expectedCash =
      toNumber(session.valor_inicial) +
      toNumber(totalsByMethod.dinheiro) +
      totalSuprimentos -
      totalSangrias;

    const difference = roundMoney(toNumber(data.dinheiroContado) - expectedCash);

    const report = {
      expectedCash: roundMoney(expectedCash),
      counted: {
        dinheiro: roundMoney(data.dinheiroContado),
        cartao_debito: roundMoney(data.cartaoDebito),
        cartao_credito: roundMoney(data.cartaoCredito),
        pix: roundMoney(data.pix),
        voucher: roundMoney(data.voucher),
        transferencia: roundMoney(data.transferencia),
        faturado: roundMoney(data.faturado),
        cortesia: roundMoney(data.cortesia),
        outros: roundMoney(data.outros)
      },
      payments: totalsByMethod,
      totalVendido,
      totalSuprimentos,
      totalSangrias,
      diferencaCaixa: difference
    };

    return withTransaction(async (client) => {
      await this.repository.createCashMovement(
        {
          sessionId,
          tipo: "fechamento",
          valor: roundMoney(data.dinheiroContado),
          motivo: "Fechamento de caixa",
          operadorId: session.operador_id,
          observacoes: data.observacoes
        },
        client
      );

      return this.repository.closeSession(
        sessionId,
        {
          totalVendido,
          totalSuprimentos,
          totalSangrias,
          dinheiroContado: roundMoney(data.dinheiroContado),
          cartaoDebito: roundMoney(data.cartaoDebito),
          cartaoCredito: roundMoney(data.cartaoCredito),
          pix: roundMoney(data.pix),
          voucher: roundMoney(data.voucher),
          transferencia: roundMoney(data.transferencia),
          faturado: roundMoney(data.faturado),
          cortesia: roundMoney(data.cortesia),
          outros: roundMoney(data.outros),
          diferencaCaixa: difference,
          report,
          observacoes: data.observacoes
        },
        client
      );
    });
  }

  async listSales() {
    return this.repository.listSales();
  }

  async saleDetails(saleId) {
    const details = await this.repository.getSaleById(saleId);

    if (!details.sale) {
      throw new AppError("Venda nao encontrada.", 404);
    }

    return details;
  }

  async createSale({ user, data }) {
    const operatorId = data.operadorId || user?.id || null;
    const session = operatorId ? await this.repository.getCurrentSessionByOperator(operatorId) : null;

    if (!session && data.cobrarImediatamente) {
      throw new AppError("Abra um caixa antes de registrar venda com pagamento imediato.", 409);
    }

    const products = await this.repository.getProductsByIds(data.itens.map((item) => item.produtoId));
    const productsById = new Map(products.map((product) => [product.id, product]));

    const hydratedItems = data.itens.map((item) => {
      const product = productsById.get(item.produtoId);

      if (!product) {
        throw new AppError("Produto nao encontrado para venda.", 404);
      }

      if (toNumber(product.quantidade_atual) < toNumber(item.quantidade)) {
        throw new AppError(`Estoque insuficiente para ${product.nome}.`, 409);
      }

      const gross = roundMoney(toNumber(item.quantidade) * toNumber(item.precoUnitario));
      const discount = roundMoney(toNumber(item.desconto));
      const total = roundMoney(gross - discount);

      return {
        ...item,
        product,
        gross,
        discount,
        total
      };
    });

    const subtotal = roundMoney(hydratedItems.reduce((sum, item) => sum + item.gross, 0));
    const itemDiscount = roundMoney(hydratedItems.reduce((sum, item) => sum + item.discount, 0));
    const total = roundMoney(subtotal - itemDiscount - toNumber(data.descontoGeral) + toNumber(data.acrescimo));

    if (total < 0) {
      throw new AppError("O valor total da venda nao pode ser negativo.", 422);
    }

    const paymentTotal = roundMoney((data.pagamentos || []).reduce((sum, payment) => sum + toNumber(payment.valor), 0));

    if (data.cobrarImediatamente && paymentTotal !== total) {
      throw new AppError("A soma dos pagamentos deve ser igual ao total da venda.", 422);
    }

    if (data.lancarNaConta && !data.contaHospedagemId) {
      throw new AppError("Selecione uma conta de hospedagem para lancar na conta do hospede.", 422);
    }

    const documentType =
      data.emitirDocumento === "nfce" ? "NFCe" :
      data.emitirDocumento === "nfe" ? "NFe" :
      null;

    const sale = await withTransaction(async (client) => {
      const createdSale = await this.repository.createSale(
        {
          codigo: `VEN-${Date.now()}`,
          tipo: data.origemVenda,
          origemVenda: data.origemVenda,
          hospedeId: data.hospedeId,
          contaHospedagemId: data.contaHospedagemId,
          reservaId: data.reservaId,
          quartoId: data.quartoId,
          operadorId,
          sessionId: session?.id || null,
          valorTotal: total,
          metodoPagamento: data.pagamentos[0]?.metodo || (data.lancarNaConta ? "faturado" : "dinheiro"),
          subtotal,
          descontoGeral: roundMoney(data.descontoGeral),
          acrescimo: roundMoney(data.acrescimo),
          cupomCodigo: data.cupomCodigo,
          observacoes: data.observacoes,
          lancarNaConta: data.lancarNaConta,
          cobrarImediatamente: data.cobrarImediatamente,
          documentoTipo: documentType,
          statusFiscal: documentType ? "pendente" : "sem_documento"
        },
        client
      );

      for (const item of hydratedItems) {
        await this.repository.createSaleItem(
          {
            saleId: createdSale.id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            desconto: item.desconto,
            nomeProduto: item.product.nome,
            codigoProduto: item.product.codigo_barras,
            observacoes: item.observacoes,
            valorBruto: item.gross
          },
          client
        );

        await this.repository.updateStock(item.produtoId, -toNumber(item.quantidade), client);
        await this.repository.createStockMovement(
          {
            produtoId: item.produtoId,
            tipo: "saida",
            quantidade: toNumber(item.quantidade),
            reservaId: data.reservaId,
            hospedeId: data.hospedeId,
            usuarioId: operatorId,
            observacoes: `Venda ${createdSale.codigo}`
          },
          client
        );
      }

      if (data.cobrarImediatamente) {
        for (const payment of data.pagamentos) {
          await this.repository.createSalePayment(
            {
              saleId: createdSale.id,
              sessionId: session?.id || null,
              metodo: payment.metodo,
              valor: roundMoney(payment.valor),
              observacoes: payment.observacoes
            },
            client
          );
        }
      }

      if (data.lancarNaConta && data.contaHospedagemId) {
        await this.repository.updateGuestAccountBalance(data.contaHospedagemId, total, client);
      }

      await this.financeService.createEntry(
        {
          tipo: "receita",
          categoria: data.origemVenda,
          descricao: `Venda ${createdSale.codigo}`,
          valor: total,
          origem_modulo: "pdv",
          origem_id: createdSale.id,
          data_lancamento: new Date(),
          status: data.cobrarImediatamente ? "liquidado" : "aberto"
        },
        client
      );

      return createdSale;
    });

    if (data.lancarNaConta && data.hospedeId) {
      broadcastGuestAccount({
        guestId: data.hospedeId,
        saleId: sale.id,
        total: sale.valor_total
      });
    }

    if (data.emitirDocumento === "nfce") {
      const fiscal = await this.fiscalService.emitNfce({ vendaId: sale.id });
      return { ...(await this.saleDetails(sale.id)), fiscal };
    }

    if (data.emitirDocumento === "nfe") {
      const fiscal = await this.fiscalService.emitNfeSale({ vendaId: sale.id });
      return { ...(await this.saleDetails(sale.id)), fiscal };
    }

    return this.saleDetails(sale.id);
  }

  async cancelSale({ saleId, user, data }) {
    const details = await this.saleDetails(saleId);

    if (details.sale.status === "cancelada") {
      throw new AppError("Venda ja cancelada.", 409);
    }

    await withTransaction(async (client) => {
      for (const item of details.items) {
        await this.repository.updateStock(item.produto_id, toNumber(item.quantidade), client);
        await this.repository.createStockMovement(
          {
            produtoId: item.produto_id,
            tipo: "entrada",
            quantidade: toNumber(item.quantidade),
            reservaId: details.sale.reserva_id,
            hospedeId: details.sale.hospede_id,
            usuarioId: user?.id,
            observacoes: `Cancelamento venda ${details.sale.codigo}`
          },
          client
        );
      }

      if (details.sale.lancar_na_conta && details.sale.conta_hospedagem_id) {
        await this.repository.updateGuestAccountBalance(
          details.sale.conta_hospedagem_id,
          -toNumber(details.sale.valor_total),
          client
        );
      }

      await this.repository.updateSaleStatus(
        saleId,
        "cancelada",
        {
          motivoCancelamento: data.motivo,
          statusFiscal: data.cancelarDocumentoFiscal ? "cancelamento_pendente" : undefined
        },
        client
      );

      await this.repository.updateFinancialEntriesBySale(saleId, "cancelado", client);
      await this.repository.createCancellation(
        {
          entidade: "venda",
          entidadeId: saleId,
          motivo: data.motivo,
          operadorId: user?.id,
          supervisorSenhaHash: hashSupervisorSecret(data.supervisorSenha)
        },
        client
      );
    });

    if (data.cancelarDocumentoFiscal && details.sale.documento_tipo) {
      await this.fiscalService.cancelDocument({
        referenceType: details.sale.documento_tipo,
        referenceId: saleId,
        reason: data.motivo
      });
    }

    return this.saleDetails(saleId);
  }

  async refundSale({ saleId, user, data }) {
    const details = await this.saleDetails(saleId);
    const itemsById = new Map(details.items.map((item) => [item.id, item]));
    let totalRefunded = 0;

    await withTransaction(async (client) => {
      for (const refundItem of data.itens) {
        const saleItem = itemsById.get(refundItem.saleItemId);

        if (!saleItem) {
          throw new AppError("Item da venda nao encontrado para devolucao.", 404);
        }

        if (toNumber(refundItem.quantidade) > toNumber(saleItem.quantidade)) {
          throw new AppError("Quantidade de devolucao superior ao item vendido.", 422);
        }

        const unitNet = roundMoney(toNumber(saleItem.preco_unitario) - toNumber(saleItem.desconto));
        const refundValue = roundMoney(unitNet * toNumber(refundItem.quantidade));
        totalRefunded += refundValue;

        await this.repository.createRefund(
          {
            saleId,
            saleItemId: refundItem.saleItemId,
            quantidade: refundItem.quantidade,
            valor: refundValue,
            motivo: data.motivo,
            operadorId: user?.id
          },
          client
        );

        await this.repository.updateStock(saleItem.produto_id, toNumber(refundItem.quantidade), client);
        await this.repository.createStockMovement(
          {
            produtoId: saleItem.produto_id,
            tipo: "entrada",
            quantidade: toNumber(refundItem.quantidade),
            reservaId: details.sale.reserva_id,
            hospedeId: details.sale.hospede_id,
            usuarioId: user?.id,
            observacoes: `Devolucao venda ${details.sale.codigo}`
          },
          client
        );
      }

      if (details.sale.lancar_na_conta && details.sale.conta_hospedagem_id) {
        await this.repository.updateGuestAccountBalance(
          details.sale.conta_hospedagem_id,
          -totalRefunded,
          client
        );
      }
    });

    const fullRefund = totalRefunded >= toNumber(details.sale.valor_total);

    if (fullRefund) {
      await this.repository.updateSaleStatus(saleId, "devolvida");
    }

    return this.saleDetails(saleId);
  }

  async emitSaleDocument({ saleId, type }) {
    if (type === "nfce") {
      return this.fiscalService.emitNfce({ vendaId: saleId });
    }

    return this.fiscalService.emitNfeSale({ vendaId: saleId });
  }

  async reprintDocument(documentId) {
    return this.fiscalService.findDocument(documentId);
  }

  async createRoomService({ user, data }) {
    const operatorId = data.operadorId || user?.id || null;
    const products = await this.repository.getProductsByIds(data.itens.map((item) => item.produtoId));
    const productsById = new Map(products.map((product) => [product.id, product]));

    const hydratedItems = data.itens.map((item) => {
      const product = productsById.get(item.produtoId);

      if (!product) {
        throw new AppError("Produto nao encontrado para room service.", 404);
      }

      if (toNumber(product.quantidade_atual) < toNumber(item.quantidade)) {
        throw new AppError(`Estoque insuficiente para ${product.nome}.`, 409);
      }

      return {
        ...item,
        product,
        total: roundMoney(toNumber(item.quantidade) * toNumber(item.precoUnitario))
      };
    });

    const total = roundMoney(hydratedItems.reduce((sum, item) => sum + item.total, 0));

    const order = await withTransaction(async (client) => {
      const createdOrder = await this.repository.createRoomServiceOrder(
        {
          hospedeId: data.hospedeId,
          quartoId: data.quartoId,
          contaHospedagemId: data.contaHospedagemId,
          areaEntrega: data.areaEntrega,
          valorTotal: total,
          observacoes: data.observacoes,
          operadorId
        },
        client
      );

      for (const item of hydratedItems) {
        await this.repository.createRoomServiceItem(
          {
            orderId: createdOrder.id,
            produtoId: item.produtoId,
            nomeProduto: item.product.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario
          },
          client
        );

        await this.repository.updateStock(item.produtoId, -toNumber(item.quantidade), client);
        await this.repository.createStockMovement(
          {
            produtoId: item.produtoId,
            tipo: "saida",
            quantidade: toNumber(item.quantidade),
            hospedeId: data.hospedeId,
            usuarioId: operatorId,
            observacoes: `Room service ${createdOrder.id}`
          },
          client
        );
      }

      await this.repository.updateGuestAccountBalance(data.contaHospedagemId, total, client);
      return createdOrder;
    });

    broadcastOrderStatus({
      kind: "created",
      order,
      guestId: data.hospedeId
    });
    broadcastGuestAccount({ guestId: data.hospedeId, orderId: order.id, total });

    return order;
  }

  async updateRoomServiceStatus(orderId, data) {
    const order = await this.repository.updateRoomServiceStatus(orderId, data.status, data.observacoes);

    if (!order) {
      throw new AppError("Pedido de room service nao encontrado.", 404);
    }

    broadcastOrderStatus({
      kind: "updated",
      order,
      guestId: order.hospede_id
    });

    return order;
  }

  async reports() {
    const sales = await this.repository.listSales();

    const byOperator = {};
    const byPayment = {};
    let totalSales = 0;
    let totalCancelled = 0;
    let lodgingRevenue = 0;
    let consumptionRevenue = 0;
    let roomServiceRevenue = 0;
    let comboRevenue = 0;

    for (const sale of sales) {
      const amount = toNumber(sale.valor_total);
      totalSales += amount;

      byOperator[sale.operador_nome || "Sem operador"] =
        roundMoney(toNumber(byOperator[sale.operador_nome || "Sem operador"]) + amount);

      byPayment[sale.metodo_pagamento || "nao_informado"] =
        roundMoney(toNumber(byPayment[sale.metodo_pagamento || "nao_informado"]) + amount);

      if (sale.status === "cancelada") {
        totalCancelled += 1;
      }

      if (sale.origem_venda === "hospedagem") {
        lodgingRevenue += amount;
      } else if (sale.origem_venda === "room_service") {
        roomServiceRevenue += amount;
      } else {
        consumptionRevenue += amount;
      }
    }

    const ticketMedio = sales.length ? roundMoney(totalSales / sales.length) : 0;

    return {
      vendasPorOperador: byOperator,
      vendasPorFormaPagamento: byPayment,
      cancelamentos: totalCancelled,
      ticketMedio,
      faturamentoHospedagem: roundMoney(lodgingRevenue),
      faturamentoConsumo: roundMoney(consumptionRevenue),
      roomService: roundMoney(roomServiceRevenue),
      combosVendidos: roundMoney(comboRevenue)
    };
  }
}
