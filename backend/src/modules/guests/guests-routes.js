import crypto from "node:crypto";
import multer from "multer";
import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../../config/database.js";
import { authorizePermission } from "../../middleware/auth.js";
import { auditAction } from "../../middleware/audit.js";
import { AppError } from "../../utils/app-error.js";
import { uploadPrivateFile, deleteStorageFile, streamFileToResponse } from "../../services/storage.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];

    if (!allowed.includes(file.mimetype)) {
      callback(new AppError("Tipo de arquivo invalido. Use PDF, JPG, JPEG, PNG ou WEBP.", 422));
      return;
    }

    callback(null, true);
  }
});

const guestSchema = z.object({
  nome: z.string().min(3),
  nome_social: z.string().optional().or(z.literal("")),
  data_nascimento: z.string().optional().or(z.literal("")),
  genero: z.string().optional().or(z.literal("")),
  nacionalidade: z.string().optional().or(z.literal("")),
  profissao: z.string().optional().or(z.literal("")),
  tipo_documento: z.string().optional().or(z.literal("")),
  numero_documento: z.string().optional().or(z.literal("")),
  orgao_emissor: z.string().optional().or(z.literal("")),
  uf_emissor: z.string().optional().or(z.literal("")),
  data_emissao_documento: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  validade_documento: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().min(8),
  whatsapp: z.string().optional().or(z.literal("")),
  cep: z.string().optional().or(z.literal("")),
  logradouro: z.string().optional().or(z.literal("")),
  numero_endereco: z.string().optional().or(z.literal("")),
  complemento: z.string().optional().or(z.literal("")),
  bairro: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  uf: z.string().max(2).optional().or(z.literal("")),
  pais: z.string().optional().or(z.literal("")),
  motivo_viagem: z.string().optional().or(z.literal("")),
  meio_transporte: z.string().optional().or(z.literal("")),
  procedencia: z.string().optional().or(z.literal("")),
  destino: z.string().optional().or(z.literal("")),
  data_prevista_chegada: z.string().optional().or(z.literal("")),
  data_prevista_saida: z.string().optional().or(z.literal("")),
  observacoes_internas: z.string().optional().or(z.literal("")),
  responsavel_legal_nome: z.string().optional().or(z.literal("")),
  responsavel_legal_cpf: z.string().optional().or(z.literal("")),
  responsavel_legal_documento: z.string().optional().or(z.literal("")),
  responsavel_legal_telefone: z.string().optional().or(z.literal("")),
  responsavel_legal_parentesco: z.string().optional().or(z.literal("")),
  responsavel_legal_observacoes: z.string().optional().or(z.literal("")),
  autorizacao_anexada: z.boolean().optional(),
  consentimento_lgpd: z.boolean().optional(),
  consentimento_lgpd_em: z.string().optional().or(z.literal("")),
  finalidade_lgpd: z.string().optional().or(z.literal("")),
  documento_conferido: z.boolean().optional(),
  documento_conferido_em: z.string().optional().or(z.literal("")),
  documento_conferido_por: z.string().optional().or(z.literal(""))
});

router.get("/", authorizePermission("guests.manage"), async (_request, response) => {
  const result = await query(
    `SELECT *
     FROM hospedes
     WHERE deleted_at IS NULL
     ORDER BY nome`
  );

  return response.json(result.rows);
});

router.get("/:id", authorizePermission("guests.manage"), async (request, response) => {
  const [guestResult, staysResult, consumptionResult, documentsResult, lgpdResult] = await Promise.all([
    query(`SELECT * FROM hospedes WHERE id = $1 AND deleted_at IS NULL`, [request.params.id]),
    query(
      `SELECT id, data_checkin, data_checkout, status
       FROM reservas
       WHERE hospede_id = $1
       ORDER BY data_checkin DESC`,
      [request.params.id]
    ),
    query(
      `SELECT v.id, v.codigo, v.valor_total, v.created_at
       FROM vendas v
       WHERE v.hospede_id = $1
       ORDER BY v.created_at DESC`,
      [request.params.id]
    ),
    query(
      `SELECT id, guest_id, document_type, original_filename, mime_type, file_size, description, uploaded_by, uploaded_at, deleted_at
       FROM guest_documents
       WHERE guest_id = $1 AND deleted_at IS NULL
       ORDER BY uploaded_at DESC`,
      [request.params.id]
    ),
    query(
      `SELECT consent_type, accepted, accepted_at, accepted_by, purpose, ip_address
       FROM guest_lgpd_consents
       WHERE guest_id = $1
       ORDER BY accepted_at DESC
       LIMIT 1`,
      [request.params.id]
    )
  ]);

  if (!guestResult.rows.length) {
    throw new AppError("Hospede nao encontrado.", 404);
  }

  return response.json({
    ...guestResult.rows[0],
    historico: staysResult.rows,
    consumo: consumptionResult.rows,
    documents: documentsResult.rows,
    lgpd: lgpdResult.rows[0] || null
  });
});

router.post("/", authorizePermission("guests.manage"), auditAction("create", "hospedes"), async (request, response) => {
  const data = guestSchema.parse(request.body);

  const result = await withTransaction(async (client) => {
    const guestResult = await client.query(
      `INSERT INTO hospedes (
        nome, nome_social, data_nascimento, genero, nacionalidade, profissao,
        tipo_documento, numero_documento, orgao_emissor, uf_emissor, data_emissao_documento,
        cpf, validade_documento, email, telefone, whatsapp, cep, logradouro, numero_endereco,
        complemento, bairro, cidade, uf, pais, motivo_viagem, meio_transporte, procedencia,
        destino, data_prevista_chegada, data_prevista_saida, observacoes_internas,
        responsavel_legal_nome, responsavel_legal_cpf, responsavel_legal_documento,
        responsavel_legal_telefone, responsavel_legal_parentesco, responsavel_legal_observacoes,
        autorizacao_anexada, consentimento_lgpd, consentimento_lgpd_em, finalidade_lgpd,
        documento_conferido, documento_conferido_em, documento_conferido_por
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44
      )
      RETURNING *`,
      [
        data.nome,
        data.nome_social || null,
        data.data_nascimento || null,
        data.genero || null,
        data.nacionalidade || null,
        data.profissao || null,
        data.tipo_documento || null,
        data.numero_documento || null,
        data.orgao_emissor || null,
        data.uf_emissor || null,
        data.data_emissao_documento || null,
        data.cpf || null,
        data.validade_documento || null,
        data.email || null,
        data.telefone,
        data.whatsapp || null,
        data.cep || null,
        data.logradouro || null,
        data.numero_endereco || null,
        data.complemento || null,
        data.bairro || null,
        data.cidade || null,
        data.uf || null,
        data.pais || null,
        data.motivo_viagem || null,
        data.meio_transporte || null,
        data.procedencia || null,
        data.destino || null,
        data.data_prevista_chegada || null,
        data.data_prevista_saida || null,
        data.observacoes_internas || null,
        data.responsavel_legal_nome || null,
        data.responsavel_legal_cpf || null,
        data.responsavel_legal_documento || null,
        data.responsavel_legal_telefone || null,
        data.responsavel_legal_parentesco || null,
        data.responsavel_legal_observacoes || null,
        data.autorizacao_anexada ?? false,
        data.consentimento_lgpd ?? false,
        data.consentimento_lgpd ? data.consentimento_lgpd_em || new Date().toISOString() : null,
        data.finalidade_lgpd || null,
        data.documento_conferido ?? false,
        data.documento_conferido ? data.documento_conferido_em || new Date().toISOString() : null,
        data.documento_conferido_por || null
      ]
    );

    if (data.consentimento_lgpd) {
      await client.query(
        `INSERT INTO guest_lgpd_consents (guest_id, consent_type, accepted, accepted_at, accepted_by, purpose, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          guestResult.rows[0].id,
          "data_storage",
          true,
          data.consentimento_lgpd_em || new Date().toISOString(),
          request.user?.id || null,
          data.finalidade_lgpd || "Hospedagem, obrigacao legal e controle operacional",
          request.ip
        ]
      );
    }

    return guestResult.rows[0];
  });

  return response.status(201).json(result);
});

router.put("/:id", authorizePermission("guests.manage"), auditAction("update", "hospedes"), async (request, response) => {
  const data = guestSchema.parse(request.body);

  const result = await query(
    `UPDATE hospedes SET
      nome = $2,
      nome_social = $3,
      data_nascimento = $4,
      genero = $5,
      nacionalidade = $6,
      profissao = $7,
      tipo_documento = $8,
      numero_documento = $9,
      orgao_emissor = $10,
      uf_emissor = $11,
      data_emissao_documento = $12,
      cpf = $13,
      validade_documento = $14,
      email = $15,
      telefone = $16,
      whatsapp = $17,
      cep = $18,
      logradouro = $19,
      numero_endereco = $20,
      complemento = $21,
      bairro = $22,
      cidade = $23,
      uf = $24,
      pais = $25,
      motivo_viagem = $26,
      meio_transporte = $27,
      procedencia = $28,
      destino = $29,
      data_prevista_chegada = $30,
      data_prevista_saida = $31,
      observacoes_internas = $32,
      responsavel_legal_nome = $33,
      responsavel_legal_cpf = $34,
      responsavel_legal_documento = $35,
      responsavel_legal_telefone = $36,
      responsavel_legal_parentesco = $37,
      responsavel_legal_observacoes = $38,
      autorizacao_anexada = $39,
      consentimento_lgpd = $40,
      consentimento_lgpd_em = $41,
      finalidade_lgpd = $42,
      documento_conferido = $43,
      documento_conferido_em = $44,
      documento_conferido_por = $45,
      updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      request.params.id,
      data.nome,
      data.nome_social || null,
      data.data_nascimento || null,
      data.genero || null,
      data.nacionalidade || null,
      data.profissao || null,
      data.tipo_documento || null,
      data.numero_documento || null,
      data.orgao_emissor || null,
      data.uf_emissor || null,
      data.data_emissao_documento || null,
      data.cpf || null,
      data.validade_documento || null,
      data.email || null,
      data.telefone,
      data.whatsapp || null,
      data.cep || null,
      data.logradouro || null,
      data.numero_endereco || null,
      data.complemento || null,
      data.bairro || null,
      data.cidade || null,
      data.uf || null,
      data.pais || null,
      data.motivo_viagem || null,
      data.meio_transporte || null,
      data.procedencia || null,
      data.destino || null,
      data.data_prevista_chegada || null,
      data.data_prevista_saida || null,
      data.observacoes_internas || null,
      data.responsavel_legal_nome || null,
      data.responsavel_legal_cpf || null,
      data.responsavel_legal_documento || null,
      data.responsavel_legal_telefone || null,
      data.responsavel_legal_parentesco || null,
      data.responsavel_legal_observacoes || null,
      data.autorizacao_anexada ?? false,
      data.consentimento_lgpd ?? false,
      data.consentimento_lgpd ? data.consentimento_lgpd_em || new Date().toISOString() : null,
      data.finalidade_lgpd || null,
      data.documento_conferido ?? false,
      data.documento_conferido ? data.documento_conferido_em || new Date().toISOString() : null,
      data.documento_conferido_por || null
    ]
  );

  if (!result.rows.length) {
    throw new AppError("Hospede nao encontrado.", 404);
  }

  return response.json(result.rows[0]);
});

router.delete("/:id", authorizePermission("guests.manage"), auditAction("delete", "hospedes"), async (request, response) => {
  await query(`UPDATE hospedes SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [request.params.id]);
  return response.status(204).send();
});

router.get("/:id/documents", authorizePermission("guests.manage"), async (request, response) => {
  const result = await query(
    `SELECT id, guest_id, document_type, original_filename, mime_type, file_size, description, uploaded_by, uploaded_at
     FROM guest_documents
     WHERE guest_id = $1 AND deleted_at IS NULL
     ORDER BY uploaded_at DESC`,
    [request.params.id]
  );

  return response.json(result.rows);
});

router.post(
  "/:id/documents",
  authorizePermission("guests.manage"),
  auditAction("upload", "guest_documents"),
  upload.single("file"),
  async (request, response) => {
    if (!request.file) {
      throw new AppError("Selecione um arquivo para upload.", 400);
    }

    const { storageKey, bucketName } = await uploadPrivateFile(
      request.file.buffer,
      request.file.originalname,
      request.file.mimetype
    );

    const storedFilename = `${crypto.randomUUID()}${require_ext(request.file.originalname)}`;

    const result = await query(
      `INSERT INTO guest_documents (
        guest_id, document_type, original_filename, stored_filename, file_path,
        mime_type, file_size, description, uploaded_by, storage_key, bucket_name, uploaded_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
       RETURNING id, guest_id, document_type, original_filename, stored_filename, mime_type, file_size, description, uploaded_by, uploaded_at`,
      [
        request.params.id,
        request.body.document_type || "Outro",
        request.file.originalname,
        storedFilename,
        storageKey,
        request.file.mimetype,
        request.file.size,
        request.body.description || null,
        request.user?.id || "system",
        storageKey,
        bucketName
      ]
    );

    return response.status(201).json(result.rows[0]);
  }
);

function require_ext(filename) {
  const ext = filename ? filename.split(".").pop() : "";
  return ext ? `.${ext}` : ".bin";
}

router.get("/:id/documents/:documentId/view", authorizePermission("guests.manage"), async (request, response) => {
  const result = await query(
    `SELECT *
     FROM guest_documents
     WHERE id = $1 AND guest_id = $2 AND deleted_at IS NULL`,
    [request.params.documentId, request.params.id]
  );

  if (!result.rows.length) {
    throw new AppError("Documento nao encontrado.", 404);
  }

  const document = result.rows[0];

  await query(
    `INSERT INTO guest_audit_logs (guest_id, action, document_id, user_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      request.params.id,
      "view_document",
      request.params.documentId,
      request.user?.id || null,
      JSON.stringify({ filename: document.original_filename })
    ]
  );

  const storageKey = document.storage_key || document.file_path;
  const bucketName = document.bucket_name || null;

  if (!storageKey) {
    throw new AppError("Arquivo nao disponivel no armazenamento persistente.", 404);
  }

  response.set(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(document.original_filename)}"`
  );

  await streamFileToResponse(storageKey, response, { bucketName });
});

router.get("/:id/documents/:documentId/download", authorizePermission("guests.manage"), async (request, response) => {
  const result = await query(
    `SELECT *
     FROM guest_documents
     WHERE id = $1 AND guest_id = $2 AND deleted_at IS NULL`,
    [request.params.documentId, request.params.id]
  );

  if (!result.rows.length) {
    throw new AppError("Documento nao encontrado.", 404);
  }

  const document = result.rows[0];

  await query(
    `INSERT INTO guest_audit_logs (guest_id, action, document_id, user_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      request.params.id,
      "download_document",
      request.params.documentId,
      request.user?.id || null,
      JSON.stringify({ filename: document.original_filename })
    ]
  );

  const storageKey = document.storage_key || document.file_path;
  const bucketName = document.bucket_name || null;

  if (!storageKey) {
    throw new AppError("Arquivo nao disponivel no armazenamento persistente.", 404);
  }

  response.set(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(document.original_filename)}"`
  );

  await streamFileToResponse(storageKey, response, { bucketName });
});

router.delete("/:id/documents/:documentId", authorizePermission("guests.manage"), auditAction("delete", "guest_documents"), async (request, response) => {
  const result = await query(
    `SELECT storage_key, file_path, bucket_name FROM guest_documents WHERE id = $1 AND guest_id = $2`,
    [request.params.documentId, request.params.id]
  );

  if (result.rows.length) {
    const key = result.rows[0].storage_key || result.rows[0].file_path;
    const bucketName = result.rows[0].bucket_name || null;
    if (key) {
      await deleteStorageFile(key, { bucketName }).catch(() => {});
    }
  }

  await query(
    `UPDATE guest_documents
     SET deleted_at = NOW()
     WHERE id = $1 AND guest_id = $2`,
    [request.params.documentId, request.params.id]
  );

  return response.status(204).send();
});

export { router as guestsRoutes };
