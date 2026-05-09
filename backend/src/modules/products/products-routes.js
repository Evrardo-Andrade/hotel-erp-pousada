import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/database.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { AppError } from "../../utils/app-error.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "..", "..", "..", "..", "uploads", "products");

fs.mkdirSync(uploadDir, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadDir),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    callback(null, `${Date.now()}-${Math.random().toString(16).slice(2, 8)}${extension}`);
  }
});

const upload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 4 * 1024 * 1024
  },
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

function buildImageUrl(filename) {
  return filename ? `/uploads/products/${filename}` : null;
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
    nome: z.string().min(3),
    categoria: z.string().min(2),
    preco: z.number().nonnegative()
  }).parse(request.body);

  const currentProduct = await getProductById(request.params.id);

  if (!currentProduct) {
    throw new AppError("Produto nao encontrado.", 404);
  }

  await query(
    `UPDATE produtos
     SET nome = $2,
         categoria = $3,
         preco = $4,
         codigo_barras = $5,
         internal_code = $6,
         tipo_produto = $7,
         permite_combo = $8,
         updated_at = NOW()
     WHERE id = $1`,
    [
      request.params.id,
      data.nome,
      data.categoria,
      data.preco,
      data.codigoBarras ?? null,
      data.codigoInterno ?? null,
      data.tipoProduto,
      data.permiteCombo
    ]
  );

  if (typeof data.estoqueInicial === "number") {
    await query(
      `INSERT INTO estoque (produto_id, quantidade_atual)
       VALUES ($1, $2)
       ON CONFLICT (produto_id)
       DO UPDATE SET quantidade_atual = EXCLUDED.quantidade_atual, updated_at = NOW()`,
      [request.params.id, data.estoqueInicial]
    );
  }

  return response.json(await getProductById(request.params.id));
});

router.post("/:id/image", authorizePermission("products.manage"), auditAction("upload_image", "produtos"), upload.single("image"), async (request, response) => {
  const currentProduct = await getProductById(request.params.id);

  if (!currentProduct) {
    if (request.file?.path) {
      fs.unlink(request.file.path, () => {});
    }

    throw new AppError("Produto nao encontrado.", 404);
  }

  if (!request.file) {
    throw new AppError("Selecione uma imagem para upload.", 422);
  }

  if (currentProduct.image_filename) {
    fs.unlink(path.join(uploadDir, currentProduct.image_filename), () => {});
  }

  await query(
    `UPDATE produtos
     SET image_filename = $2,
         image_url = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [request.params.id, request.file.filename, buildImageUrl(request.file.filename)]
  );

  return response.json(await getProductById(request.params.id));
});

router.delete("/:id/image", authorizePermission("products.manage"), auditAction("delete_image", "produtos"), async (request, response) => {
  const currentProduct = await getProductById(request.params.id);

  if (!currentProduct) {
    throw new AppError("Produto nao encontrado.", 404);
  }

  if (currentProduct.image_filename) {
    fs.unlink(path.join(uploadDir, currentProduct.image_filename), () => {});
  }

  await query(
    `UPDATE produtos
     SET image_filename = NULL,
         image_url = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [request.params.id]
  );

  return response.status(204).send();
});

export { router as productsRoutes };
