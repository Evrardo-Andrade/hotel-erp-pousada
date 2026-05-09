import { query } from "../config/database.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { FiscalDocumentBuilder } from "./fiscal-document-builder.js";
import { SefazClient } from "./sefaz-client.js";
import { DanfeService } from "./danfe-service.js";

function buildXml(documentPayload, authorization) {
  const itemsXml = documentPayload.itens
    .map(
      (item) => `
    <det nItem="${item.itemNumber}">
      <cProd>${item.codigo}</cProd>
      <xProd>${item.descricao}</xProd>
      <qCom>${item.quantidade}</qCom>
      <vUnCom>${item.valorUnitario}</vUnCom>
      <vProd>${item.valorTotal}</vProd>
    </det>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<NFe>
  <infNFe>
    <ide>
      <mod>${documentPayload.ide.modelo}</mod>
      <serie>${documentPayload.ide.serie}</serie>
      <nNF>${documentPayload.ide.numero}</nNF>
      <tpAmb>${documentPayload.ide.ambiente}</tpAmb>
      <cUF>${documentPayload.ide.uf}</cUF>
    </ide>
    <emit>
      <CNPJ>${documentPayload.emitente.cnpj}</CNPJ>
      <xNome>${documentPayload.emitente.razaoSocial}</xNome>
    </emit>
    ${documentPayload.destinatario ? `<dest><xNome>${documentPayload.destinatario.nome}</xNome><CPF>${documentPayload.destinatario.cpf || ""}</CPF></dest>` : ""}
    ${itemsXml}
    <total>
      <vProd>${documentPayload.totais.valorProdutos}</vProd>
      <vDesc>${documentPayload.totais.valorDesconto}</vDesc>
      <vNF>${documentPayload.totais.valorNota}</vNF>
    </total>
    <protNFe>
      <chNFe>${authorization.chaveAcesso}</chNFe>
      <nProt>${authorization.protocolo}</nProt>
      <nRec>${authorization.recibo}</nRec>
    </protNFe>
  </infNFe>
</NFe>`;
}

export class FiscalService {
  constructor() {
    this.builder = new FiscalDocumentBuilder();
    this.sefazClient = new SefazClient();
    this.danfeService = new DanfeService();
  }

  async getFiscalSettings() {
    const result = await query(
      `SELECT chave, valor
       FROM configuracoes
       WHERE chave IN ('empresa', 'fiscal_nfce', 'fiscal_nfe')`
    );

    return result.rows.reduce((accumulator, row) => {
      accumulator[row.chave] = row.valor;
      return accumulator;
    }, {});
  }

  async getActiveCertificate() {
    const result = await query(
      `SELECT id, nome_arquivo, caminho_arquivo, validade, ativo
       FROM certificados
       WHERE ativo = true
       ORDER BY created_at DESC
       LIMIT 1`
    );

    return result.rows[0] || null;
  }

  async getSaleContext(vendaId) {
    const [saleResult, itemsResult] = await Promise.all([
      query(
        `SELECT v.*, h.nome, h.cpf, h.email
         FROM vendas v
         LEFT JOIN hospedes h ON h.id = v.hospede_id
         WHERE v.id = $1`,
        [vendaId]
      ),
      query(
        `SELECT iv.*, p.nome AS produto_nome
         FROM itens_venda iv
         JOIN produtos p ON p.id = iv.produto_id
         WHERE iv.venda_id = $1`,
        [vendaId]
      )
    ]);

    return {
      sale: saleResult.rows[0],
      items: itemsResult.rows
    };
  }

  async getCheckoutContext(contaHospedagemId) {
    const [stayResult, salesResult] = await Promise.all([
      query(
        `SELECT ch.*, h.nome, h.cpf, h.email
         FROM contas_hospedagem ch
         JOIN hospedes h ON h.id = ch.hospede_id
         WHERE ch.id = $1`,
        [contaHospedagemId]
      ),
      query(
        `SELECT iv.*, p.nome AS produto_nome
         FROM vendas v
         JOIN itens_venda iv ON iv.venda_id = v.id
         JOIN produtos p ON p.id = iv.produto_id
         WHERE v.conta_hospedagem_id = $1`,
        [contaHospedagemId]
      )
    ]);

    return {
      stayAccount: stayResult.rows[0],
      items: salesResult.rows
    };
  }

  async persistDocument({
    tipo,
    referenciaId,
    documentPayload,
    authorization,
    xml,
    danfeHtml,
    endpoint
  }) {
    const result = await query(
      `INSERT INTO documentos_fiscais (
        tipo,
        referencia_id,
        chave_acesso,
        numero,
        serie,
        status,
        xml,
        protocolo,
        recibo,
        ambiente,
        endpoint,
        payload,
        danfe_html
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        tipo,
        referenciaId,
        authorization.chaveAcesso,
        documentPayload.ide.numero,
        documentPayload.ide.serie,
        authorization.status,
        xml,
        authorization.protocolo,
        authorization.recibo,
        env.fiscalEnv,
        endpoint,
        JSON.stringify(documentPayload),
        danfeHtml
      ]
    );

    return result.rows[0];
  }

  async emitNfce({ vendaId }) {
    const [{ sale, items }, settings, certificate] = await Promise.all([
      this.getSaleContext(vendaId),
      this.getFiscalSettings(),
      this.getActiveCertificate()
    ]);

    if (!sale) {
      throw new AppError("Venda nao encontrada.", 404);
    }

    const payload = this.builder.buildNfceDocument({
      sale,
      guest: sale.hospede_id ? { nome: sale.nome, cpf: sale.cpf, email: sale.email } : null,
      company: settings.empresa,
      fiscalConfig: settings.fiscal_nfce,
      items,
      environment: env.fiscalEnv,
      uf: env.sefazUf
    });

    const authorization = await this.sefazClient.authorize({
      documentType: "nfce",
      documentPayload: payload,
      certificate
    });

    const xml = buildXml(payload, authorization);
    const danfeHtml = this.danfeService.generateHtml(payload, authorization);
    const persisted = await this.persistDocument({
      tipo: "NFCe",
      referenciaId: sale.id,
      documentPayload: payload,
      authorization,
      xml,
      danfeHtml,
      endpoint: authorization.endpoint
    });

    await query(
      `UPDATE vendas
       SET status_fiscal = 'autorizado',
           xml_fiscal = $2,
           chave_acesso = $3,
           numero_fiscal = $4,
           serie_fiscal = $5
       WHERE id = $1`,
      [sale.id, xml, authorization.chaveAcesso, payload.ide.numero, payload.ide.serie]
    );

    return {
      id: persisted.id,
      tipo: "NFCe",
      numero: payload.ide.numero,
      serie: payload.ide.serie,
      protocolo: authorization.protocolo,
      recibo: authorization.recibo,
      chaveAcesso: authorization.chaveAcesso,
      ambiente: env.fiscalEnv,
      endpoint: authorization.endpoint,
      xml,
      danfeHtml
    };
  }

  async emitNfeCheckout({ hospedagemId }) {
    const [{ stayAccount, items }, settings, certificate] = await Promise.all([
      this.getCheckoutContext(hospedagemId),
      this.getFiscalSettings(),
      this.getActiveCertificate()
    ]);

    if (!stayAccount) {
      throw new AppError("Conta de hospedagem nao encontrada.", 404);
    }

    const payload = this.builder.buildNfeCheckoutDocument({
      stayAccount,
      guest: { nome: stayAccount.nome, cpf: stayAccount.cpf, email: stayAccount.email },
      company: settings.empresa,
      fiscalConfig: settings.fiscal_nfe || settings.fiscal_nfce,
      environment: env.fiscalEnv,
      uf: env.sefazUf,
      items
    });

    const authorization = await this.sefazClient.authorize({
      documentType: "nfe",
      documentPayload: payload,
      certificate
    });

    const xml = buildXml(payload, authorization);
    const danfeHtml = this.danfeService.generateHtml(payload, authorization);
    const persisted = await this.persistDocument({
      tipo: "NFe",
      referenciaId: stayAccount.id,
      documentPayload: payload,
      authorization,
      xml,
      danfeHtml,
      endpoint: authorization.endpoint
    });

    return {
      id: persisted.id,
      tipo: "NFe",
      numero: payload.ide.numero,
      serie: payload.ide.serie,
      protocolo: authorization.protocolo,
      recibo: authorization.recibo,
      chaveAcesso: authorization.chaveAcesso,
      ambiente: env.fiscalEnv,
      endpoint: authorization.endpoint,
      xml,
      danfeHtml
    };
  }

  async emitNfeSale({ vendaId }) {
    const [{ sale, items }, settings, certificate] = await Promise.all([
      this.getSaleContext(vendaId),
      this.getFiscalSettings(),
      this.getActiveCertificate()
    ]);

    if (!sale) {
      throw new AppError("Venda nao encontrada.", 404);
    }

    const payload = this.builder.buildNfeSaleDocument({
      sale,
      guest: sale.hospede_id ? { nome: sale.nome, cpf: sale.cpf, email: sale.email } : null,
      company: settings.empresa,
      fiscalConfig: settings.fiscal_nfe || settings.fiscal_nfce,
      items,
      environment: env.fiscalEnv,
      uf: env.sefazUf
    });

    const authorization = await this.sefazClient.authorize({
      documentType: "nfe",
      documentPayload: payload,
      certificate
    });

    const xml = buildXml(payload, authorization);
    const danfeHtml = this.danfeService.generateHtml(payload, authorization);
    const persisted = await this.persistDocument({
      tipo: "NFe",
      referenciaId: sale.id,
      documentPayload: payload,
      authorization,
      xml,
      danfeHtml,
      endpoint: authorization.endpoint
    });

    await query(
      `UPDATE vendas
       SET status_fiscal = 'autorizado',
           xml_fiscal = $2,
           chave_acesso = $3,
           numero_fiscal = $4,
           serie_fiscal = $5
       WHERE id = $1`,
      [sale.id, xml, authorization.chaveAcesso, payload.ide.numero, payload.ide.serie]
    );

    return {
      id: persisted.id,
      tipo: "NFe",
      numero: payload.ide.numero,
      serie: payload.ide.serie,
      protocolo: authorization.protocolo,
      recibo: authorization.recibo,
      chaveAcesso: authorization.chaveAcesso,
      ambiente: env.fiscalEnv,
      endpoint: authorization.endpoint,
      xml,
      danfeHtml
    };
  }

  async findDocument(documentId) {
    const result = await query(
      `SELECT *
       FROM documentos_fiscais
       WHERE id = $1`,
      [documentId]
    );

    if (!result.rows.length) {
      throw new AppError("Documento fiscal nao encontrado.", 404);
    }

    return result.rows[0];
  }

  async cancelDocument({ referenceType, referenceId, reason }) {
    const documentResult = await query(
      `SELECT *
       FROM documentos_fiscais
       WHERE tipo = $1 AND referencia_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [referenceType, referenceId]
    );

    if (!documentResult.rows.length) {
      throw new AppError("Documento fiscal nao encontrado.", 404);
    }

    const fiscalDocument = documentResult.rows[0];
    const cancellation = await this.sefazClient.cancel({
      documentType: referenceType.toLowerCase(),
      accessKey: fiscalDocument.chave_acesso,
      reason
    });

    const result = await query(
      `UPDATE documentos_fiscais
       SET status = 'cancelado',
           evento_cancelamento = $2,
           protocolo_cancelamento = $3
       WHERE id = $1
       RETURNING *`,
      [fiscalDocument.id, reason, cancellation.protocoloCancelamento]
    );

    return result.rows[0];
  }
}
