import { z } from "zod";

export const paymentMethods = [
  "dinheiro",
  "pix",
  "cartao_debito",
  "cartao_credito",
  "voucher",
  "transferencia",
  "faturado",
  "cortesia",
  "outros"
];

export const saleOrigins = [
  "balcao",
  "hospede",
  "room_service",
  "consumo_interno",
  "hospedagem"
];

export const finalizationModes = [
  "pedido",
  "sem_documento",
  "nfce",
  "nfe",
  "conta_hospede"
];

export const cashMovementTypes = ["abertura", "suprimento", "sangria", "fechamento"];
export const roomServiceStatuses = ["novo", "em_preparo", "entregue", "cancelado"];

export const splitPaymentSchema = z.object({
  metodo: z.enum(paymentMethods),
  valor: z.number().nonnegative(),
  observacoes: z.string().max(300).optional().nullable()
});

export const saleItemSchema = z.object({
  produtoId: z.string().uuid(),
  quantidade: z.number().positive(),
  precoUnitario: z.number().nonnegative(),
  desconto: z.number().nonnegative().default(0),
  observacoes: z.string().max(300).optional().nullable()
});

export const openCashSessionSchema = z.object({
  operadorId: z.string().uuid().optional(),
  valorInicial: z.number().nonnegative(),
  observacoes: z.string().max(500).optional().nullable()
});

export const cashMovementSchema = z.object({
  valor: z.number().positive(),
  motivo: z.string().min(3).max(200),
  operadorId: z.string().uuid().optional(),
  observacoes: z.string().max(500).optional().nullable()
});

export const closeCashSessionSchema = z.object({
  dinheiroContado: z.number().nonnegative().default(0),
  cartaoDebito: z.number().nonnegative().default(0),
  cartaoCredito: z.number().nonnegative().default(0),
  pix: z.number().nonnegative().default(0),
  voucher: z.number().nonnegative().default(0),
  transferencia: z.number().nonnegative().default(0),
  faturado: z.number().nonnegative().default(0),
  cortesia: z.number().nonnegative().default(0),
  outros: z.number().nonnegative().default(0),
  observacoes: z.string().max(500).optional().nullable()
});

export const saleSchema = z.object({
  origemVenda: z.enum(saleOrigins),
  hospedeId: z.string().uuid().optional().nullable(),
  reservaId: z.string().uuid().optional().nullable(),
  quartoId: z.string().uuid().optional().nullable(),
  contaHospedagemId: z.string().uuid().optional().nullable(),
  operadorId: z.string().uuid().optional(),
  itens: z.array(saleItemSchema).min(1),
  pagamentos: z.array(splitPaymentSchema).default([]),
  descontoGeral: z.number().nonnegative().default(0),
  acrescimo: z.number().nonnegative().default(0),
  cupomCodigo: z.string().max(40).optional().nullable(),
  observacoes: z.string().max(800).optional().nullable(),
  lancarNaConta: z.boolean().default(false),
  cobrarImediatamente: z.boolean().default(true),
  emitirDocumento: z.enum(finalizationModes).default("sem_documento"),
  documentoCliente: z.object({
    nome: z.string().max(160).optional().nullable(),
    cpf: z.string().max(20).optional().nullable(),
    cnpj: z.string().max(20).optional().nullable(),
    endereco: z.string().max(250).optional().nullable(),
    ie: z.string().max(30).optional().nullable(),
    consumidorFinal: z.boolean().default(true),
    naturezaOperacao: z.string().max(120).optional().nullable(),
    cfop: z.string().max(10).optional().nullable(),
    cstCsosn: z.string().max(10).optional().nullable(),
    ncm: z.string().max(20).optional().nullable()
  }).optional().default({})
});

export const cancelSaleSchema = z.object({
  motivo: z.string().min(5).max(500),
  supervisorSenha: z.string().min(4).max(120),
  cancelarDocumentoFiscal: z.boolean().default(false)
});

export const refundSchema = z.object({
  motivo: z.string().min(5).max(500),
  itens: z.array(
    z.object({
      saleItemId: z.string().uuid(),
      quantidade: z.number().positive()
    })
  ).min(1)
});

export const roomServiceSchema = z.object({
  hospedeId: z.string().uuid(),
  quartoId: z.string().uuid(),
  contaHospedagemId: z.string().uuid(),
  areaEntrega: z.string().min(2).max(120),
  observacoes: z.string().max(500).optional().nullable(),
  operadorId: z.string().uuid().optional(),
  itens: z.array(saleItemSchema).min(1)
});

export const roomServiceStatusSchema = z.object({
  status: z.enum(roomServiceStatuses),
  observacoes: z.string().max(500).optional().nullable()
});
