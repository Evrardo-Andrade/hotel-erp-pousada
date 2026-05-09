import multer from "multer";
import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/database.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { AppError } from "../../utils/app-error.js";
import { uploadPublicFile, deleteStorageFile, streamFileToResponse } from "../../services/storage.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      callback(new AppError("Tipo de imagem invalido. Use jpg, jpeg, png ou webp.", 422));
      return;
    }
    callback(null, true);
  }
});

const productSchema = z.object({
  nome: z.string().min(3),
  categoria: z.string().min(2),
  preco: z.number().nonnegative(),
  codigoBarras: z.string().max(60).optional().nullable(),
  codigoInterno: z.string().max(60).optional().nullable(),
  estoqueInicial: z.number().nonnegative().default(0),
  tipoProduto: z.enum(["consumo", "insumo", "experiencia", "servico", "locacao"]).default("consumo"),
  permiteCombo: z.boolean().default(false)
});

async function listProducts(search = "") {
  const hasSearch = search.trim().length >= 2;
  const params = hasSearch ? [`%${search.trim()}%`] : [];
  const searchClause = hasSearch
    ? `WHERE
        p.nome ILIKE $1 OR
        COALESCE(p.internal_code, '') ILIKE $1 OR
        COALESCE(p.codigo_barras, '') ILIKE $1 OR
        COALESCE(p.categoria, '') ILIKE $1`
    : "";

  const result = await query(
    `SELECT p.*, COALESCE(e.quantidade_atual, 0) AS quantidade_atual
     FROM produtos p
     LEFT JOIN estoque e ON e.produto_id = p.id
     ${searchClause}
     ORDER BY p.nome`,
    params
  );

  return result.rows;
}

async function getProductById(productId) {
  const result = await query(
    `SELECT p.*, COALESCE(e.quantidade_atual, 0) AS quantidade_atual
     FROM produtos p
     LEFT JOIN estoque e ON e.produto_id = p.id
     WHERE p.id = $1`,
    [productId]
  );

  return result.rows[0] || null;
}

router.get("/", authorizePermission("products.read"), async (_request, response) => {
  return response.json(await listProducts());
});

router.get("/search", authorizePermission("products.read"), async (request, response) => {
  const q = String(request.query.q || "");
  return response.json(await listProducts(q));
});

router.post("/", authorizePermission("products.manage"), auditAction("create", "produtos"), async (request, response) => {
  const data = productSchema.parse(request.body);

  const productResult = await query(
    `INSERT INTO produtos (
      nome, categoria, preco, codigo_barras, internal_code, tipo_produto, permite_combo, ativo
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    RETURNING *`,
    [
      data.nome,
      data.categoria,
      data.preco,
      data.codigoBarras || null,
      data.codigoInterno || null,
      data.tipoProduto,
      data.permiteCombo
    ]
  );

  await query(
    `INSERT INTO estoque (produto_id, quantidade_atual)
     VALUES ($1, $2)
     ON CONFLICT (produto_id)
     DO UPDATE SET quantidade_atual = EXCLUDED.quantidade_atual, updated_at = NOW()`,
    [productResult.rows[0].id, data.estoqueInicial]
  );

  return response.status(201).json(await getProductById(productResult.rows[0].id));
});

router.put("/:id", authorizePermission("products.manage"), auditAction("update", "produtos"), async (request, response) => {
  const data = productSchema.partial({ estoqueInicial: true }).extend({
    nome: z.string().min(