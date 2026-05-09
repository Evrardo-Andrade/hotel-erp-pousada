import { query, withTransaction } from "../config/database.js";

export class FinanceService {
  async createEntry(entry, client = null) {
    const executor = client || { query };
    const result = await executor.query(
      `INSERT INTO financeiro (
        tipo, categoria, descricao, valor, origem_modulo, origem_id, data_lancamento, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        entry.tipo,
        entry.categoria,
        entry.descricao,
        entry.valor,
        entry.origem_modulo,
        entry.origem_id,
        entry.data_lancamento,
        entry.status || "aberto"
      ]
    );

    return result.rows[0];
  }

  async createSaleSettlement(sale) {
    return withTransaction(async (client) => {
      await this.createEntry(
        {
          tipo: "receita",
          categoria: "venda",
          descricao: `Venda ${sale.codigo}`,
          valor: sale.valor_total,
          origem_modulo: "pdv",
          origem_id: sale.id,
          data_lancamento: new Date(),
          status: "liquidado"
        },
        client
      );
    });
  }

  async listSummary() {
    const [balance, entries] = await Promise.all([
      query(
        `SELECT
          COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receitas,
          COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesas
         FROM financeiro`
      ),
      query(
        `SELECT id, tipo, categoria, descricao, valor, status, data_lancamento
         FROM financeiro
         ORDER BY data_lancamento DESC
         LIMIT 20`
      )
    ]);

    const receitas = Number(balance.rows[0].receitas);
    const despesas = Number(balance.rows[0].despesas);

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      ultimosLancamentos: entries.rows
    };
  }
}
