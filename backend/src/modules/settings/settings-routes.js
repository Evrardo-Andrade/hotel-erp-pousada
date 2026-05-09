import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { Router } from "express";
import { z } from "zod";
import { query } from "../../config/database.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { encrypt } from "../../utils/crypto.js";
import { AppError } from "../../utils/app-error.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }
});
const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.resolve(__dirname, "../../../uploads/company");

const companySchema = z.object({
  trade_name: z.string().optional().or(z.literal("")),
  legal_name: z.string().optional().or(z.literal("")),
  cnpj: z.string().optional().or(z.literal("")),
  state_registration: z.string().optional().or(z.literal("")),
  municipal_registration: z.string().optional().or(z.literal("")),
  cnae: z.string().optional().or(z.literal("")),
  tax_regime: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  zip_code: z.string().optional().or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  number: z.string().optional().or(z.literal("")),
  complement: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  primary_color: z.string().optional().or(z.literal("")),
  default_theme: z.string().optional().or(z.literal("")),
  admin_name: z.string().optional().or(z.literal("")),
  admin_email: z.string().email().optional().or(z.literal("")),
  admin_phone: z.string().optional().or(z.literal("")),
  admin_user_id: z.string().optional().or(z.literal("")),
  admin_access_profile: z.string().optional().or(z.literal("")),
  subtitle: z.string().optional().or(z.literal(""))
});

async function ensureUploadsDirectory() {
  await fs.mkdir(uploadsDirectory, { recursive: true });
}

async function getCurrentCompany() {
  const result = await query(
    `SELECT *
     FROM company_settings
     ORDER BY created_at
     LIMIT 1`
  );

  return result.rows[0] || null;
}

router.get("/", authorizePermission("settings.read"), async (_request, response) => {
  const result = await query(
    `SELECT chave, valor, secao
     FROM configuracoes
     ORDER BY secao, chave`
  );

  return response.json(result.rows);
});

router.get("/company", authorizePermission("settings.read"), async (_request, response) => {
  const current = await getCurrentCompany();

  return response.json(current || {
    trade_name: "Click7 Systems",
    legal_name: "Click7 Systems",
    default_theme: "classic-light",
    admin_access_profile: "admin",
    subtitle: "Hotel ERP - Operacao e fiscal"
  });
});

router.put("/company", authorizePermission("settings.manage"), auditAction("upsert", "company_settings"), async (request, response) => {
  const data = companySchema.parse(request.body);
  const current = await getCurrentCompany();

  const result = current
    ? await query(
        `UPDATE company_settings SET
          trade_name = $2,
          legal_name = $3,
          cnpj = $4,
          state_registration = $5,
          municipal_registration = $6,
          cnae = $7,
          tax_regime = $8,
          phone = $9,
          whatsapp = $10,
          email = $11,
          zip_code = $12,
          street = $13,
          number = $14,
          complement = $15,
          district = $16,
          city = $17,
          state = $18,
          country = $19,
          primary_color = $20,
          default_theme = $21,
          admin_name = $22,
          admin_email = $23,
          admin_phone = $24,
          admin_user_id = NULLIF($25, '')::uuid,
          admin_access_profile = $26,
          updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          current.id,
          data.trade_name || null,
          data.legal_name || null,
          data.cnpj || null,
          data.state_registration || null,
          data.municipal_registration || null,
          data.cnae || null,
          data.tax_regime || null,
          data.phone || null,
          data.whatsapp || null,
          data.email || null,
          data.zip_code || null,
          data.street || null,
          data.number || null,
          data.complement || null,
          data.district || null,
          data.city || null,
          data.state || null,
          data.country || null,
          data.primary_color || null,
          data.default_theme || null,
          data.admin_name || null,
          data.admin_email || null,
          data.admin_phone || null,
          data.admin_user_id || "",
          data.admin_access_profile || "admin"
        ]
      )
    : await query(
        `INSERT INTO company_settings (
          trade_name, legal_name, cnpj, state_registration, municipal_registration, cnae, tax_regime,
          phone, whatsapp, email, zip_code, street, number, complement, district, city, state, country,
          primary_color, default_theme, admin_name, admin_email, admin_phone, admin_user_id, admin_access_profile
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NULLIF($24, '')::uuid,$25
        )
        RETURNING *`,
        [
          data.trade_name || null,
          data.legal_name || null,
          data.cnpj || null,
          data.state_registration || null,
          data.municipal_registration || null,
          data.cnae || null,
          data.tax_regime || null,
          data.phone || null,
          data.whatsapp || null,
          data.email || null,
          data.zip_code || null,
          data.street || null,
          data.number || null,
          data.complement || null,
          data.district || null,
          data.city || null,
          data.state || null,
          data.country || null,
          data.primary_color || null,
          data.default_theme || null,
          data.admin_name || null,
          data.admin_email || null,
          data.admin_phone || null,
          data.admin_user_id || "",
          data.admin_access_profile || "admin"
        ]
      );

  return response.json({
    ...result.rows[0],
    subtitle: data.subtitle || "Hotel ERP - Operacao e fiscal"
  });
});

router.post("/company/logo", authorizePermission("settings.manage"), auditAction("upload_logo", "company_settings"), upload.single("logo"), async (request, response) => {
  if (!request.file) {
    throw new AppError("Selecione uma logo para upload.", 400);
  }

  await ensureUploadsDirectory();
  const extension = path.extname(request.file.originalname || "").toLowerCase();
  const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

  if (!allowed.has(extension)) {
    throw new AppError("Formato de logomarca nao permitido.", 400);
  }

  const safeName = `${Date.now()}-${request.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const physicalPath = path.join(uploadsDirectory, safeName);
  await fs.writeFile(physicalPath, request.file.buffer);

  const current = await getCurrentCompany();
  let result;

  if (current) {
    result = await query(
      `UPDATE company_settings
       SET logo_url = $2, logo_filename = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [current.id, `/uploads/company/${safeName}`, safeName]
    );
  } else {
    result = await query(
      `INSERT INTO company_settings (trade_name, legal_name, logo_url, logo_filename)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      ["Click7 Systems", "Click7 Systems", `/uploads/company/${safeName}`, safeName]
    );
  }

  return response.json({
    ...result.rows[0],
    subtitle: "Hotel ERP - Operacao e fiscal"
  });
});

router.delete("/company/logo", authorizePermission("settings.manage"), auditAction("delete_logo", "company_settings"), async (_request, response) => {
  const current = await getCurrentCompany();

  if (!current) {
    return response.json({
      trade_name: "Click7 Systems",
      legal_name: "Click7 Systems",
      logo_url: "",
      logo_filename: "",
      subtitle: "Hotel ERP - Operacao e fiscal"
    });
  }

  const result = await query(
    `UPDATE company_settings
     SET logo_url = NULL, logo_filename = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [current.id]
  );

  return response.json({
    ...result.rows[0],
    subtitle: "Hotel ERP - Operacao e fiscal"
  });
});

router.post("/", authorizePermission("settings.manage"), auditAction("upsert", "configuracoes"), async (request, response) => {
  const schema = z.object({
    chave: z.string().min(2),
    secao: z.string().min(2),
    valor: z.any()
  });

  const data = schema.parse(request.body);
  const result = await query(
    `INSERT INTO configuracoes (chave, secao, valor)
     VALUES ($1, $2, $3)
     ON CONFLICT (chave)
     DO UPDATE SET secao = EXCLUDED.secao, valor = EXCLUDED.valor, updated_at = NOW()
     RETURNING *`,
    [data.chave, data.secao, JSON.stringify(data.valor)]
  );

  return response.status(201).json(result.rows[0]);
});

router.post("/certificate", authorizePermission("settings.manage"), upload.single("arquivo"), auditAction("upload_certificate", "certificados"), async (request, response) => {
  const schema = z.object({
    senha: z.string().min(1),
    validade: z.string()
  });

  const data = schema.parse(request.body);
  const result = await query(
    `INSERT INTO certificados (
      nome_arquivo, caminho_arquivo, senha_criptografada, validade, ativo
    ) VALUES ($1, $2, $3, $4, true)
    RETURNING id, nome_arquivo, validade, ativo`,
    [
      request.file?.originalname || "certificado-a1.pfx",
      request.file?.path || "tmp/certificado-a1.pfx",
      encrypt(data.senha),
      data.validade
    ]
  );

  return response.status(201).json(result.rows[0]);
});

export { router as settingsRoutes };
