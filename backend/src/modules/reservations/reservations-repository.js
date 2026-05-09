import { query, withTransaction } from "../../config/database.js";

const reservationBaseSelect = `
  SELECT
    r.*,
    h.nome AS hospede_nome,
    h.cpf AS hospede_documento,
    h.telefone AS hospede_telefone,
    h.email AS hospede_email,
    q.numero AS quarto_numero,
    q.capacidade AS quarto_capacidade,
    ta.nome AS tipo_acomodacao,
    tq.nome AS tipo_quarto
  FROM reservas r
  JOIN hospedes h ON h.id = r.hospede_id
  JOIN quartos q ON q.id = r.quarto_id
  JOIN tipos_acomodacao ta ON ta.id = q.tipo_acomodacao_id
  JOIN tipos_quarto tq ON tq.id = q.tipo_quarto_id
`;

export class ReservationsRepository {
  async listReservations() {
    const result = await query(
      `${reservationBaseSelect}
       ORDER BY r.data_checkin DESC, r.created_at DESC`
    );

    return Promise.all(result.rows.map((row) => this.getReservationDetails(row.id)));
  }

  async getReservationById(id) {
    return this.getReservationDetails(id);
  }

  async getReservationDetails(id) {
    const [reservationResult, guestsResult, combosResult, paymentsResult] = await Promise.all([
      query(`${reservationBaseSelect} WHERE r.id = $1`, [id]),
      query(
        `SELECT rg.*, h.nome AS hospede_nome
         FROM reservation_guests rg
         LEFT JOIN hospedes h ON h.id = rg.guest_id
         WHERE rg.reservation_id = $1
         ORDER BY rg.created_at`,
        [id]
      ),
      query(
        `SELECT rci.*, cd.nome AS combo_nome, cd.descricao AS combo_descricao
         FROM reservation_combo_items rci
         JOIN combo_definitions cd ON cd.id = rci.combo_definition_id
         WHERE rci.reservation_id = $1
         ORDER BY rci.created_at`,
        [id]
      ),
      query(
        `SELECT *
         FROM reservation_payments
         WHERE reservation_id = $1
         ORDER BY created_at DESC`,
        [id]
      )
    ]);

    const reservation = reservationResult.rows[0];

    if (!reservation) {
      return null;
    }

    return {
      ...reservation,
      acompanhantes: guestsResult.rows,
      combos: combosResult.rows,
      pagamentos: paymentsResult.rows
    };
  }

  async listMetadata() {
    const [guests, rooms, products, combos] = await Promise.all([
      query(`SELECT id, nome, cpf, email, telefone FROM hospedes ORDER BY nome`),
      query(
        `SELECT q.id, q.numero, q.capacidade, q.status,
                ta.nome AS tipo_acomodacao, tq.nome AS tipo_quarto,
                q.tipo_acomodacao_id, q.tipo_quarto_id
         FROM quartos q
         JOIN tipos_acomodacao ta ON ta.id = q.tipo_acomodacao_id
         JOIN tipos_quarto tq ON tq.id = q.tipo_quarto_id
         ORDER BY q.numero`
      ),
      query(
        `SELECT p.id, p.nome, p.categoria, p.preco, p.tipo_produto, p.ativo, p.permite_combo
         FROM produtos p
         ORDER BY p.nome`
      ),
      query(`SELECT * FROM combo_definitions ORDER BY nome`)
    ]);

    return {
      hospedes: guests.rows,
      quartos: rooms.rows,
      produtos: products.rows,
      combos: combos.rows,
      origensReserva: [
        "WhatsApp",
        "Booking",
        "Airbnb",
        "Site proprio",
        "Telefone",
        "Presencial",
        "Agencia"
      ],
      statusesReserva: [
        "pre_reserva",
        "pendente",
        "confirmada",
        "checkin_realizado",
        "hospedado",
        "checkout_realizado",
        "cancelada",
        "no_show"
      ],
      statusesCombo: ["contratado", "agendado", "em_andamento", "concluido", "cancelado"]
    };
  }

  async listCombos() {
    const result = await query(
      `SELECT cd.*,
              COALESCE(
                JSON_AGG(
                  DISTINCT JSONB_BUILD_OBJECT(
                    'id', cdi.id,
                    'produto_id', cdi.produto_id,
                    'quantidade', cdi.quantidade,
                    'produto_nome', p.nome
                  )
                ) FILTER (WHERE cdi.id IS NOT NULL),
                '[]'::json
              ) AS itens
       FROM combo_definitions cd
       LEFT JOIN combo_definition_items cdi ON cdi.combo_definition_id = cd.id
       LEFT JOIN produtos p ON p.id = cdi.produto_id
       GROUP BY cd.id
       ORDER BY cd.nome`
    );

    return result.rows;
  }

  async getComboById(id) {
    const combos = await this.listCombos();
    return combos.find((item) => item.id === id) || null;
  }

  async createCombo(payload) {
    const comboId = await withTransaction(async (client) => {
      const comboResult = await client.query(
        `INSERT INTO combo_definitions (
          nome, descricao, preco, duracao_minutos, ativo, limite_por_dia, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          payload.nome,
          payload.descricao || null,
          payload.preco,
          payload.duracao_minutos,
          payload.ativo,
          payload.limite_por_dia,
          payload.observacoes || null
        ]
      );

      for (const item of payload.itens) {
        await client.query(
          `INSERT INTO combo_definition_items (
            combo_definition_id, produto_id, quantidade
          ) VALUES ($1, $2, $3)`,
          [comboResult.rows[0].id, item.produto_id, item.quantidade]
        );
      }

      return comboResult.rows[0].id;
    });

    return this.getComboById(comboId);
  }

  async updateCombo(id, payload) {
    const comboId = await withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE combo_definitions
         SET nome = $2,
             descricao = $3,
             preco = $4,
             duracao_minutos = $5,
             ativo = $6,
             limite_por_dia = $7,
             observacoes = $8,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          payload.nome,
          payload.descricao || null,
          payload.preco,
          payload.duracao_minutos,
          payload.ativo,
          payload.limite_por_dia,
          payload.observacoes || null
        ]
      );

      if (!result.rows.length) {
        return null;
      }

      await client.query(`DELETE FROM combo_definition_items WHERE combo_definition_id = $1`, [id]);

      for (const item of payload.itens) {
        await client.query(
          `INSERT INTO combo_definition_items (
            combo_definition_id, produto_id, quantidade
          ) VALUES ($1, $2, $3)`,
          [id, item.produto_id, item.quantidade]
        );
      }

      return id;
    });

    return comboId ? this.getComboById(comboId) : null;
  }

  async deleteCombo(id) {
    const result = await query(`DELETE FROM combo_definitions WHERE id = $1 RETURNING id`, [id]);
    return result.rows[0] || null;
  }

  async findOverlappingReservation({ roomId, checkin, checkout, ignoreReservationId = null }) {
    const params = [roomId, checkin, checkout];
    let sql = `
      SELECT id
      FROM reservas
      WHERE quarto_id = $1
        AND status IN ('pre_reserva', 'pendente', 'confirmada', 'checkin_realizado', 'hospedado')
        AND daterange(data_checkin, data_checkout, '[]')
            && daterange($2::date, $3::date, '[]')
    `;

    if (ignoreReservationId) {
      params.push(ignoreReservationId);
      sql += ` AND id <> $4`;
    }

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  async findAvailableRooms({ checkin, checkout, tipoAcomodacaoId, tipoQuartoId }) {
    const params = [checkin, checkout];
    const filters = [];

    if (tipoAcomodacaoId) {
      params.push(tipoAcomodacaoId);
      filters.push(`q.tipo_acomodacao_id = $${params.length}`);
    }

    if (tipoQuartoId) {
      params.push(tipoQuartoId);
      filters.push(`q.tipo_quarto_id = $${params.length}`);
    }

    const result = await query(
      `SELECT q.id, q.numero, q.capacidade, q.status,
              ta.nome AS tipo_acomodacao, tq.nome AS tipo_quarto
       FROM quartos q
       JOIN tipos_acomodacao ta ON ta.id = q.tipo_acomodacao_id
       JOIN tipos_quarto tq ON tq.id = q.tipo_quarto_id
       WHERE q.status NOT IN ('manutencao')
         ${filters.length ? `AND ${filters.join(" AND ")}` : ""}
         AND q.id NOT IN (
           SELECT quarto_id
           FROM reservas
           WHERE status IN ('pre_reserva', 'pendente', 'confirmada', 'checkin_realizado', 'hospedado')
             AND daterange(data_checkin, data_checkout, '[]')
                 && daterange($1::date, $2::date, '[]')
         )
       ORDER BY q.numero`,
      params
    );

    return result.rows;
  }

  async createReservation(payload) {
    const reservationId = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO reservas (
          codigo_reserva,
          hospede_id,
          quarto_id,
          data_checkin,
          data_checkout,
          adultos,
          criancas,
          observacoes,
          origem,
          status,
          quantidade_hospedes,
          numero_diarias,
          valor_diaria,
          subtotal_hospedagem,
          taxas_adicionais,
          desconto,
          valor_total,
          forma_pagamento,
          status_pagamento,
          valor_pago,
          saldo_pendente,
          observacoes_internas,
          preferencias_hospede
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23
        )
        RETURNING *`,
        [
          payload.codigo_reserva,
          payload.hospede_id,
          payload.quarto_id,
          payload.data_checkin,
          payload.data_checkout,
          payload.adultos,
          payload.criancas,
          payload.observacoes || null,
          payload.origem,
          payload.status,
          payload.quantidade_hospedes,
          payload.numero_diarias,
          payload.valor_diaria,
          payload.subtotal_hospedagem,
          payload.taxas_adicionais,
          payload.desconto,
          payload.valor_total,
          payload.forma_pagamento || null,
          payload.status_pagamento,
          payload.valor_pago,
          payload.saldo_pendente,
          payload.observacoes_internas || null,
          payload.preferencias_hospede || null
        ]
      );

      await client.query(
        `INSERT INTO reservation_guests (
          reservation_id, guest_id, tipo, documento, telefone, email
        ) VALUES ($1, $2, 'principal', $3, $4, $5)`,
        [
          result.rows[0].id,
          payload.hospede_id,
          payload.documento || null,
          payload.telefone || null,
          payload.email || null
        ]
      );

      if (payload.valor_pago > 0) {
        await client.query(
          `INSERT INTO reservation_payments (
            reservation_id, forma_pagamento, status, valor, pago_em, observacoes
          ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
          [
            result.rows[0].id,
            payload.forma_pagamento || "nao_informado",
            payload.status_pagamento,
            payload.valor_pago,
            "Pagamento inicial da reserva"
          ]
        );
      }

      if (payload.combos?.length) {
        for (const combo of payload.combos) {
          await client.query(
            `INSERT INTO reservation_combo_items (
              reservation_id,
              combo_definition_id,
              quantidade,
              preco_unitario,
              valor_total,
              status,
              data_agendada,
              observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              result.rows[0].id,
              combo.combo_definition_id,
              combo.quantidade,
              combo.preco_unitario,
              combo.valor_total,
              combo.status || "contratado",
              combo.data_agendada || null,
              combo.observacoes || null
            ]
          );
        }
      }

      return result.rows[0].id;
    });

    return this.getReservationDetails(reservationId);
  }

  async updateReservation(id, payload) {
    const reservationId = await withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE reservas
         SET hospede_id = $2,
             quarto_id = $3,
             data_checkin = $4,
             data_checkout = $5,
             adultos = $6,
             criancas = $7,
             observacoes = $8,
             origem = $9,
             status = $10,
             quantidade_hospedes = $11,
             numero_diarias = $12,
             valor_diaria = $13,
             subtotal_hospedagem = $14,
             taxas_adicionais = $15,
             desconto = $16,
             valor_total = $17,
             forma_pagamento = $18,
             status_pagamento = $19,
             valor_pago = $20,
             saldo_pendente = $21,
             observacoes_internas = $22,
             preferencias_hospede = $23,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          payload.hospede_id,
          payload.quarto_id,
          payload.data_checkin,
          payload.data_checkout,
          payload.adultos,
          payload.criancas,
          payload.observacoes || null,
          payload.origem,
          payload.status,
          payload.quantidade_hospedes,
          payload.numero_diarias,
          payload.valor_diaria,
          payload.subtotal_hospedagem,
          payload.taxas_adicionais,
          payload.desconto,
          payload.valor_total,
          payload.forma_pagamento || null,
          payload.status_pagamento,
          payload.valor_pago,
          payload.saldo_pendente,
          payload.observacoes_internas || null,
          payload.preferencias_hospede || null
        ]
      );

      if (!result.rows.length) {
        return null;
      }

      await client.query(`DELETE FROM reservation_guests WHERE reservation_id = $1`, [id]);
      await client.query(
        `INSERT INTO reservation_guests (
          reservation_id, guest_id, tipo, documento, telefone, email
        ) VALUES ($1, $2, 'principal', $3, $4, $5)`,
        [
          id,
          payload.hospede_id,
          payload.documento || null,
          payload.telefone || null,
          payload.email || null
        ]
      );

      await client.query(`DELETE FROM reservation_payments WHERE reservation_id = $1`, [id]);
      if (payload.valor_pago > 0) {
        await client.query(
          `INSERT INTO reservation_payments (
            reservation_id, forma_pagamento, status, valor, pago_em, observacoes
          ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
          [id, payload.forma_pagamento || "nao_informado", payload.status_pagamento, payload.valor_pago, "Pagamento atualizado da reserva"]
        );
      }

      await client.query(`DELETE FROM reservation_combo_items WHERE reservation_id = $1`, [id]);
      if (payload.combos?.length) {
        for (const combo of payload.combos) {
          await client.query(
            `INSERT INTO reservation_combo_items (
              reservation_id,
              combo_definition_id,
              quantidade,
              preco_unitario,
              valor_total,
              status,
              data_agendada,
              observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              id,
              combo.combo_definition_id,
              combo.quantidade,
              combo.preco_unitario,
              combo.valor_total,
              combo.status || "contratado",
              combo.data_agendada || null,
              combo.observacoes || null
            ]
          );
        }
      }

      return id;
    });

    return reservationId ? this.getReservationDetails(reservationId) : null;
  }

  async updateReservationStatus(id, status) {
    const result = await query(
      `UPDATE reservas
       SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );

    if (!result.rows.length) {
      return null;
    }

    return this.getReservationDetails(id);
  }

  async deleteReservation(id) {
    const result = await query(`DELETE FROM reservas WHERE id = $1 RETURNING id`, [id]);
    return result.rows[0] || null;
  }

  async addComboToReservation(reservationId, payload) {
    const combo = await this.getComboById(payload.combo_definition_id);
    const result = await query(
      `INSERT INTO reservation_combo_items (
        reservation_id, combo_definition_id, quantidade, preco_unitario, valor_total, status, data_agendada, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        reservationId,
        payload.combo_definition_id,
        payload.quantidade,
        payload.preco_unitario,
        payload.valor_total,
        payload.status || "contratado",
        payload.data_agendada || null,
        payload.observacoes || null
      ]
    );

    return {
      ...result.rows[0],
      combo_nome: combo?.nome || null
    };
  }

  async getReservationComboById(reservationComboId) {
    const result = await query(
      `SELECT rci.*, cd.nome AS combo_nome
       FROM reservation_combo_items rci
       JOIN combo_definitions cd ON cd.id = rci.combo_definition_id
       WHERE rci.id = $1`,
      [reservationComboId]
    );

    return result.rows[0] || null;
  }

  async listComboDefinitionItems(comboDefinitionId) {
    const result = await query(
      `SELECT cdi.*, p.nome AS produto_nome, p.tipo_produto
       FROM combo_definition_items cdi
       JOIN produtos p ON p.id = cdi.produto_id
       WHERE cdi.combo_definition_id = $1`,
      [comboDefinitionId]
    );

    return result.rows;
  }

  async getProductStock(productId) {
    const result = await query(
      `SELECT p.id, p.nome, e.quantidade_atual
       FROM produtos p
       LEFT JOIN estoque e ON e.produto_id = p.id
       WHERE p.id = $1`,
      [productId]
    );

    return result.rows[0] || null;
  }

  async executeReservationCombo({ reservationId, reservationComboId, guestId, userId }) {
    const comboId = await withTransaction(async (client) => {
      const comboResult = await client.query(
        `SELECT rci.*, cd.nome AS combo_nome
         FROM reservation_combo_items rci
         JOIN combo_definitions cd ON cd.id = rci.combo_definition_id
         WHERE rci.id = $1 AND rci.reservation_id = $2
         FOR UPDATE`,
        [reservationComboId, reservationId]
      );

      const reservationCombo = comboResult.rows[0];

      if (!reservationCombo) {
        return null;
      }

      const itemsResult = await client.query(
        `SELECT cdi.*, p.nome AS produto_nome
         FROM combo_definition_items cdi
         JOIN produtos p ON p.id = cdi.produto_id
         WHERE cdi.combo_definition_id = $1`,
        [reservationCombo.combo_definition_id]
      );

      for (const item of itemsResult.rows) {
        const stockResult = await client.query(
          `SELECT quantidade_atual
           FROM estoque
           WHERE produto_id = $1
           FOR UPDATE`,
          [item.produto_id]
        );

        const quantityRequired = Number(item.quantidade) * Number(reservationCombo.quantidade);
        const currentStock = Number(stockResult.rows[0]?.quantidade_atual || 0);

        if (currentStock < quantityRequired) {
          throw new Error(`Estoque insuficiente para ${item.produto_nome}.`);
        }

        await client.query(
          `UPDATE estoque
           SET quantidade_atual = quantidade_atual - $2, updated_at = NOW()
           WHERE produto_id = $1`,
          [item.produto_id, quantityRequired]
        );

        await client.query(
          `INSERT INTO stock_movements (
            produto_id, tipo, quantidade, reserva_id, hospede_id, combo_reserva_id, usuario_id, observacoes
          ) VALUES ($1, 'saida', $2, $3, $4, $5, $6, $7)`,
          [
            item.produto_id,
            quantityRequired,
            reservationId,
            guestId,
            reservationComboId,
            userId || null,
            `Baixa por execucao do combo ${reservationCombo.combo_nome}`
          ]
        );
      }

      await client.query(
        `UPDATE reservation_combo_items
         SET status = 'concluido',
             executed_at = NOW(),
             executed_by = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [reservationComboId, userId || null]
      );

      return reservationComboId;
    });

    return comboId ? this.getReservationComboById(comboId) : null;
  }

  async getReservationConsumption(reservationId) {
    const [sales, combos, stock] = await Promise.all([
      query(
        `SELECT v.id, v.codigo, v.valor_total, v.created_at
         FROM vendas v
         WHERE v.conta_hospedagem_id IN (
           SELECT id FROM contas_hospedagem WHERE reserva_id = $1
         )
         ORDER BY v.created_at DESC`,
        [reservationId]
      ),
      query(
        `SELECT rci.*, cd.nome AS combo_nome
         FROM reservation_combo_items rci
         JOIN combo_definitions cd ON cd.id = rci.combo_definition_id
         WHERE rci.reservation_id = $1
         ORDER BY rci.created_at DESC`,
        [reservationId]
      ),
      query(
        `SELECT sm.*, p.nome AS produto_nome
         FROM stock_movements sm
         JOIN produtos p ON p.id = sm.produto_id
         WHERE sm.reserva_id = $1
         ORDER BY sm.created_at DESC`,
        [reservationId]
      )
    ]);

    return {
      vendas: sales.rows,
      combos: combos.rows,
      estoque: stock.rows
    };
  }
}
