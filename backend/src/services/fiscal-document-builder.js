import { AppError } from "../utils/app-error.js";

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function toMoney(value) {
  return Number(value || 0).toFixed(2);
}

function buildItems(items = []) {
  return items.map((item, index) => ({
    itemNumber: index + 1,
    codigo: item.produto_id,
    descricao: item.nome_produto || item.produto_nome || "Item",
    quantidade: Number(item.quantidade || 0),
    valorUnitario: Number(item.preco_unitario || 0),
    desconto: Number(item.desconto || 0),
    valorTotal: Number(item.quantidade || 0) * (Number(item.preco_unitario || 0) - Number(item.desconto || 0))
  }));
}

function buildTotals(items) {
  const products = items.reduce((sum, item) => sum + item.valorTotal, 0);
  return {
    valorProdutos: toMoney(products),
    valorDesconto: toMoney(items.reduce((sum, item) => sum + Number(item.desconto || 0), 0)),
    valorNota: toMoney(products)
  };
}

export class FiscalDocumentBuilder {
  buildNfceDocument({ sale, guest, company, fiscalConfig, items, environment, uf }) {
    if (!company?.cnpj) {
      throw new AppError("Configuracao fiscal incompleta: CNPJ da empresa nao encontrado.");
    }

    const normalizedItems = buildItems(items);

    return {
      tipo: "NFCe",
      ide: {
        modelo: "65",
        serie: sale.serie_fiscal || fiscalConfig?.serie || "1",
        numero: sale.numero_fiscal || `NFCe-${sale.codigo}`,
        ambiente: environment,
        uf
      },
      emitente: {
        cnpj: onlyDigits(company.cnpj),
        razaoSocial: company.razaoSocial || "Empresa nao configurada",
        nomeFantasia: company.nomeFantasia || company.razaoSocial || "Empresa nao configurada",
        telefone: company.telefone || ""
      },
      destinatario: guest
        ? {
            nome: guest.nome,
            cpf: onlyDigits(guest.cpf),
            email: guest.email || ""
          }
        : null,
      itens: normalizedItems,
      totais: buildTotals(normalizedItems),
      fiscal: {
        cfopPadrao: fiscalConfig?.cfop || "5102",
        cscId: fiscalConfig?.csc_id || "",
        csc: fiscalConfig?.csc || ""
      },
      pagamento: {
        forma: sale.metodo_pagamento,
        valor: toMoney(sale.valor_total)
      },
      referencia: {
        vendaId: sale.id,
        codigoVenda: sale.codigo
      }
    };
  }

  buildNfeCheckoutDocument({ stayAccount, guest, company, fiscalConfig, environment, uf, items }) {
    if (!company?.cnpj) {
      throw new AppError("Configuracao fiscal incompleta: CNPJ da empresa nao encontrado.");
    }

    const normalizedItems = buildItems(items.length ? items : [
      {
        produto_id: "hospedagem",
        nome_produto: "Hospedagem e consumos da estadia",
        quantidade: 1,
        preco_unitario: Number(stayAccount.saldo_atual || 0),
        desconto: 0
      }
    ]);

    return {
      tipo: "NFe",
      ide: {
        modelo: "55",
        serie: fiscalConfig?.serie || "1",
        numero: `NFe-${stayAccount.id.slice(0, 8)}`,
        ambiente: environment,
        uf
      },
      emitente: {
        cnpj: onlyDigits(company.cnpj),
        razaoSocial: company.razaoSocial || "Empresa nao configurada",
        nomeFantasia: company.nomeFantasia || company.razaoSocial || "Empresa nao configurada",
        telefone: company.telefone || ""
      },
      destinatario: {
        nome: guest?.nome || "Consumidor Final",
        cpf: onlyDigits(guest?.cpf || ""),
        email: guest?.email || ""
      },
      itens: normalizedItems,
      totais: buildTotals(normalizedItems),
      fiscal: {
        cfopPadrao: fiscalConfig?.cfop || "5933"
      },
      referencia: {
        contaHospedagemId: stayAccount.id,
        reservaId: stayAccount.reserva_id
      }
    };
  }

  buildNfeSaleDocument({ sale, guest, company, fiscalConfig, environment, uf, items }) {
    if (!company?.cnpj) {
      throw new AppError("Configuracao fiscal incompleta: CNPJ da empresa nao encontrado.");
    }

    const normalizedItems = buildItems(items);

    return {
      tipo: "NFe",
      ide: {
        modelo: "55",
        serie: sale.serie_fiscal || fiscalConfig?.serie || "1",
        numero: sale.numero_fiscal || `NFe-${sale.codigo}`,
        ambiente: environment,
        uf
      },
      emitente: {
        cnpj: onlyDigits(company.cnpj),
        razaoSocial: company.razaoSocial || "Empresa nao configurada",
        nomeFantasia: company.nomeFantasia || company.razaoSocial || "Empresa nao configurada",
        telefone: company.telefone || ""
      },
      destinatario: guest
        ? {
            nome: guest.nome,
            cpf: onlyDigits(guest.cpf),
            email: guest.email || ""
          }
        : {
            nome: "Consumidor Final",
            cpf: "",
            email: ""
          },
      itens: normalizedItems,
      totais: buildTotals(normalizedItems),
      fiscal: {
        cfopPadrao: fiscalConfig?.cfop || "5102"
      },
      pagamento: {
        forma: sale.metodo_pagamento,
        valor: toMoney(sale.valor_total)
      },
      referencia: {
        vendaId: sale.id,
        codigoVenda: sale.codigo
      }
    };
  }
}
