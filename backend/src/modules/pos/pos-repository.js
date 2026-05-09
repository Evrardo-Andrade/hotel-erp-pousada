import { query } from "../../config/database.js";

function executorOf(client = null) {
  return client || { query };
}

export class PosRepository {
  async getOverview() {
    const [products, guests, reservations, rooms, accounts, currentSessions, sales, roomServiceOrders] = await Promise.all([
      query(
        `SELECT p.id, p.nome, p.categoria, p.preco, p.codigo_barras, p.tipo_produto,
                COALESCE(e.quantidade_atual, 0) AS quantidade_atual
         FROM produtos p
         LEFT JOIN estoque e ON e.produto_id = p.id
         ORDER BY p.nome`
      ),
      query(`SELECT id, nome, cpf, email, telefone FROM hospedes ORDER BY nome`),
      query(
        `SELECT r.id, r.codigo_reserva, r.status, r.hospede_id, h.nome AS hospede_nome,
                r.quarto_id, q.numero AS quarto_numero
         FROM reservas r
         JOIN hospedes h ON h.id = r.hospede_id
         JOIN quartos q ON q.id = r.quarto_id
         WHERE r.status IN ('confirmada', 'checkin_realizado', 'hospedado')
         ORDER BY r.data_checkin DESC`
      ),
      query(
        `SELECT id, numero, status, capacidade
         FROM quartos
         ORDER BY numero`
      ),
      query(
        `SELECT ch.id, ch.reserva_id, ch.hospede_id, ch.quarto_id, ch.status, ch.saldo_atual,
                h.nome AS hospede_nome, q.numero AS quarto_numero
         FROM contas_hospedagem ch
         JOIN hospedes h ON h.id = ch.hospede_id
         JOIN quartos q ON q.id = ch.quarto_id
         WHERE ch.status = 'aberta'
         ORDER BY ch.created_at DESC`
      ),
      query(
        `SELECT c.*, u.nome AS operador_nome
         FROM cash_register_sessions c
         LEFT JOIN usuarios u ON u.id = c.operador_id
         WHERE c.status = 'aberto'
         ORDER BY c.opened_at DESC`
      ),
      query(
        `SELECT v.id, v.codigo, v.origem_venda, v.metodo_pagamento, v.valor_total, v.status, v.status_fiscal,
                v.created_at, h.nome AS hospede_nome, q.numero AS quarto_numero,
                u.nome AS operador_nome
         FROM vendas v
         LEFT JOIN hospedes h ON h.id = v.hospede_id
         LEFT JOIN quartos q ON q.id = v.quarto_id
         LEFT JOIN usuarios u ON u.id = v.operador_id
         ORDER BY v.created_at DESC
         LIMIT 20`
      ),
      query(
        `SELECT p.id, p.status, p.valor_total, p.area_entrega, p.observacoes, p.created_at,
                h.nome AS hospede_nome, q.numero AS quarto_numero
         FROM pedidos p
         JOIN hospedes h ON h.id = p.hospede_id
         JOIN quartos q ON q.id = p.quarto_id
         ORDER BY p.created_at DESC
         LIMIT 20`
      )
    ]);

    return {
      products: products.rows,
      guests: guests.rows,
      reservations: reservations.rows,
      rooms: rooms.rows,
      guestAccounts: accounts.rows,
      currentSessions: currentSessions.rows,
      sales: sales.rows,
      roomServiceOrders: roomServiceOrders.rows
    };
  }

  async listSales() {
    const result = await query(
      `SELECT v.id, v.codigo, v.origem_venda, v.metodo_pagamento, v.valor_total, v.status, v.status_fiscal,
              v.documento_tipo, v.created_at, h.nome AS hospede_nome, q.numero AS quarto_numero,
              u.nome AS operador_nome
       FROM vendas v
       LEFT JOIN hospedes h ON h.id = v.hospede_id
       LEFT JOIN quartos q ON q.id = v.quarto_id
       LEFT JOIN usuarios u ON u.id = v.operador_id
       ORDER BY v.created_at DESC`
    );

    return result.rows;
  }

  async getSaleById(saleId, client = null) {
    const executor = executorOf(client);
    const [saleResult, itemsResult, paymentsResult, refundsResult] = await Promise.all([
      executor.query(
        `SELECT v.*, h.nome AS hospede_nome, h.cpf AS hospede_cpf, h.email AS hospede_email,
                q.numero AS quarto_numero, r.codigo_reserva,
                u.nome AS operador_nome
         FROM vendas v
         LEFT JOIN hospedes h ON h.id = v.hospede_id
         LEFT JOIN quartos q ON q.id = v.quarto_id
         LEFT JOIN reservas r ON r.id = v.reserva_id
         LEFT JOIN usuarios u ON u.id = v.operador_id
         WHERE v.id = $1`,
        [saleId]
      ),
      executor.query(
        `SELECT iv.*, p.nome AS produto_nome, p.codigo_barras
         FROM itens_venda iv
         JOIN produtos p ON p.id = iv.produto_id
         WHERE iv.venda_id = $1
         ORDER BY iv.created_at`,
        [saleId]
      ),
      executor.query(
        `SELECT *
         FROM sale_payments
         WHERE venda_id = $1
         ORDER BY created_at`,
        [saleId]
      ),
      executor.query(
        `SELECT *
         FROM refunds
         WHERE venda_id = $1
         ORDER BY created_at DESC`,
        [saleId]
      )
    ]);

    return {
      sale: saleResult.rows[0] || null,
      items: itemsResult.rows,
      payments: paymentsResult.rows,
      refunds: refundsResult.rows
    };
  }

  async getCurrentSessionByOperator(operatorId) {
    const result = await query(
      `SELECT c.*, u.nome AS operador_nome
       FROM cash_register_sessions c
       LEFT JOIN usuarios u ON u.id = c.operador_id
       WHERE c.operador_id = $1
         AND c.status = 'aberto'
       ORDER BY c.opened_at DESC
       LIMIT 1`,
      [operatorId]
    );

    return result.rows[0] || null;
  }

  async getAnyOpenSession() {
    const result = await query(
      `SELECT c.*, u.nome AS operador_nome
       FROM cash_register_sessions c
       LEFT JOIN usuarios u ON u.id = c.operador_id
       WHERE c.status = 'aberto'
       ORDER BY c.opened_at DESC
       LIMIT 1`
    );

    return result.rows[0] || null;
  }

  async getSessionById(sessionId, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `SELECT c.*, u.nome AS operador_nome
       FROM cash_register_sessions c
       LEFT JOIN usuarios u ON u.id = c.operador_id
       WHERE c.id = $1`,
      [sessionId]
    );

    return result.rows[0] || null;
  }

  async createSession(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO cash_register_sessions (
        operador_id, opened_at, valor_inicial, observacoes, status
      ) VALUES ($1, NOW(), $2, $3, 'aberto')
      RETURNING *`,
      [data.operadorId, data.valorInicial, data.observacoes || null]
    );

    return result.rows[0];
  }

  async createCashMovement(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO cash_movements (
        cash_session_id, tipo, valor, motivo, operador_id, observacoes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [data.sessionId, data.tipo, data.valor, data.motivo, data.operadorId, data.observacoes || null]
    );

    return result.rows[0];
  }

  async listSessionMovements(sessionId, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `SELECT *
       FROM cash_movements
       WHERE cash_session_id = $1
       ORDER BY created_at DESC`,
      [sessionId]
    );

    return result.rows;
  }

  async closeSession(sessionId, summary, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `UPDATE cash_register_sessions
       SET status = 'fechado',
           closed_at = NOW(),
           total_vendido = $2,
           total_suprimentos = $3,
           total_sangrias = $4,
           dinheiro_contado = $5,
           total_cartao_debito = $6,
           total_cartao_credito = $7,
           total_pix = $8,
           total_voucher = $9,
           total_transferencia = $10,
           total_faturado = $11,
           total_cortesia = $12,
           total_outros = $13,
           diferenca_caixa = $14,
           fechamento_resumo = $15,
           observacoes = COALESCE($16, observacoes)
       WHERE id = $1
       RETURNING *`,
      [
        sessionId,
        summary.totalVendido,
        summary.totalSuprimentos,
        summary.totalSangrias,
        summary.dinheiroContado,
        summary.cartaoDebito,
        summary.cartaoCredito,
        summary.pix,
        summary.voucher,
        summary.transferencia,
        summary.faturado,
        summary.cortesia,
        summary.outros,
        summary.diferencaCaixa,
        JSON.stringify(summary.report),
        summary.observacoes || null
      ]
    );

    return result.rows[0];
  }

  async listSessionPayments(sessionId, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `SELECT metodo, COALESCE(SUM(valor), 0) AS total
       FROM sale_payments
       WHERE cash_session_id = $1
         AND status = 'confirmado'
       GROUP BY metodo`,
      [sessionId]
    );

    return result.rows;
  }

  async getProductsByIds(productIds, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `SELECT p.*, COALESCE(e.quantidade_atual, 0) AS quantidade_atual
       FROM produtos p
       LEFT JOIN estoque e ON e.produto_id = p.id
       WHERE p.id = ANY($1::uuid[])`,
      [productIds]
    );

    return result.rows;
  }

  async createSale(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO vendas (
        codigo, tipo, hospede_id, conta_hospedagem_id, reserva_id, quarto_id,
        operador_id, caixa_sessao_id, origem_venda, valor_total, metodo_pagamento,
        subtotal, desconto_geral, acrescimo, cupom_codigo, observacoes,
        lancar_na_conta, cobrar_imediatamente, documento_tipo, status, status_fiscal
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21
      )
      RETURNING *`,
      [
        data.codigo,
        data.tipo,
        data.hospedeId || null,
        data.contaHospedagemId || null,
        data.reservaId || null,
        data.quartoId || null,
        data.operadorId || null,
        data.sessionId || null,
        data.origemVenda,
        data.valorTotal,
        data.metodoPagamento,
        data.subtotal,
        data.descontoGeral,
        data.acrescimo,
        data.cupomCodigo || null,
        data.observacoes || null,
        data.lancarNaConta,
        data.cobrarImediatamente,
        data.documentoTipo || null,
        data.status || "concluida",
        data.statusFiscal || "pendente"
      ]
    );

    return result.rows[0];
  }

  async createSaleItem(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO itens_venda (
        venda_id, produto_id, quantidade, preco_unitario, desconto, nome_produto,
        codigo_produto, observacoes, valor_bruto
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.saleId,
        data.produtoId,
        data.quantidade,
        data.precoUnitario,
        data.desconto,
        data.nomeProduto,
        data.codigoProduto,
        data.observacoes || null,
        data.valorBruto
      ]
    );

    return result.rows[0];
  }

  async createSalePayment(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO sale_payments (
        venda_id, cash_session_id, metodo, valor, status, observacoes, created_at
      ) VALUES ($1, $2, $3, $4, 'confirmado', $5, NOW())
      RETURNING *`,
      [data.saleId, data.sessionId || null, data.metodo, data.valor, data.observacoes || null]
    );

    return result.rows[0];
  }

  async updateStock(productId, quantityDelta, client = null) {
    const executor = executorOf(client);
    await executor.query(
      `INSERT INTO estoque (produto_id, quantidade_atual, estoque_minimo, updated_at)
       VALUES ($1, 0, 0, NOW())
       ON CONFLICT (produto_id) DO NOTHING`,
      [productId]
    );

    const result = await executor.query(
      `UPDATE estoque
       SET quantidade_atual = quantidade_atual + $2,
           updated_at = NOW()
       WHERE produto_id = $1
       RETURNING *`,
      [productId, quantityDelta]
    );

    return result.rows[0];
  }

  async createStockMovement(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO stock_movements (
        produto_id, tipo, quantidade, reserva_id, hospede_id, usuario_id, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.produtoId,
        data.tipo,
        data.quantidade,
        data.reservaId || null,
        data.hospedeId || null,
        data.usuarioId || null,
        data.observacoes || null
      ]
    );

    return result.rows[0];
  }

  async updateGuestAccountBalance(accountId, amountDelta, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `UPDATE contas_hospedagem
       SET saldo_atual = saldo_atual + $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [accountId, amountDelta]
    );

    return result.rows[0] || null;
  }

  async createRoomServiceOrder(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO pedidos (
        hospede_id, quarto_id, conta_hospedagem_id, area_entrega, valor_total, status, observacoes, operador_id, origem
      ) VALUES ($1, $2, $3, $4, $5, 'novo', $6, $7, 'pdv')
      RETURNING *`,
      [
        data.hospedeId,
        data.quartoId,
        data.contaHospedagemId,
        data.areaEntrega,
        data.valorTotal,
        data.observacoes || null,
        data.operadorId || null
      ]
    );

    return result.rows[0];
  }

  async createRoomServiceItem(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO itens_pedido (
        pedido_id, produto_id, nome_produto, quantidade, preco_unitario
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [data.orderId, data.produtoId, data.nomeProduto, data.quantidade, data.precoUnitario]
    );

    return result.rows[0];
  }

  async updateRoomServiceStatus(orderId, status, observacoes, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `UPDATE pedidos
       SET status = $2,
           observacoes = COALESCE($3, observacoes),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [orderId, status, observacoes || null]
    );

    return result.rows[0] || null;
  }

  async listRoomServiceItems(orderId, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `SELECT *
       FROM itens_pedido
       WHERE pedido_id = $1`,
      [orderId]
    );

    return result.rows;
  }

  async createCancellation(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO cancellations (
        entidade, entidade_id, motivo, politica_multa, estorno_parcial, estorno_total,
        operador_id, supervisor_senha_hash, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [
        data.entidade,
        data.entidadeId,
        data.motivo,
        data.politicaMulta || null,
        data.estornoParcial || false,
        data.estornoTotal || false,
        data.operadorId || null,
        data.supervisorSenhaHash || null
      ]
    );

    return result.rows[0];
  }

  async createRefund(data, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `INSERT INTO refunds (
        venda_id, item_venda_id, quantidade, valor, motivo, operador_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [data.saleId, data.saleItemId, data.quantidade, data.valor, data.motivo, data.operadorId || null]
    );

    return result.rows[0];
  }

  async updateSaleStatus(saleId, status, extra = {}, client = null) {
    const executor = executorOf(client);
    const result = await executor.query(
      `UPDATE vendas
       SET status = $2,
           motivo_cancelamento = COALESCE($3, motivo_cancelamento),
           status_fiscal = COALESCE($4, status_fiscal),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [saleId, status, extra.motivoCancelamento || null, extra.statusFiscal || null]
    );

    return result.rows[0] || null;
  }

  async updateFinancialEntriesBySale(saleId, status, client = null) {
    const executor = executorOf(client);
    await executor.query(
      `UPDATE financeiro
       SET status = $2
       WHERE origem_modulo = 'pdv'
         AND origem_id = $1`,
      [saleId, status]
    );
  }

  async getSessionReport(sessionId) {
    const [session, movements, payments, cancellations] = await Promise.all([
      this.getSessionById(sessionId),
      this.listSessionMovements(sessionId),
      this.listSessionPayments(sessionId),
      query(
        `SELECT COUNT(*)::int AS total_cancelamentos
         FROM cancellations c
         JOIN vendas v ON v.id = c.entidade_id
         WHERE c.entidade = 'venda'
           AND v.caixa_sessao_id = $1`,
        [sessionId]
      )
    ]);

    return {
      session,
      movements,
      payments,
      cancellations: cancellations.rows[0]?.total_cancelamentos || 0
    };
  }
}
