import crypto from "crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

function buildAccessKey({ cnpj, modelo, serie, numero, ambiente, uf }) {
  const seed = `${cnpj}${modelo}${serie}${numero}${ambiente}${uf}${Date.now()}`;
  return crypto.createHash("sha1").update(seed).digest("hex").slice(0, 44).toUpperCase();
}

function buildSignedEnvelope(documentPayload, certificate) {
  const serialized = JSON.stringify(documentPayload);
  const digest = crypto.createHash("sha256").update(serialized).digest("base64");
  const thumbprint = crypto
    .createHash("sha1")
    .update(`${certificate?.nome_arquivo || "SEM_CERTIFICADO"}:${certificate?.validade || ""}`)
    .digest("hex");

  return {
    digest,
    thumbprint,
    payload: documentPayload
  };
}

export class SefazClient {
  getEndpoint(documentType) {
    const endpointGroup = env.sefazUrls[documentType.toLowerCase()];

    if (!endpointGroup) {
      throw new AppError("Tipo de documento fiscal nao suportado.");
    }

    return endpointGroup[env.fiscalEnv];
  }

  async authorize({ documentType, documentPayload, certificate }) {
    if (!certificate) {
      throw new AppError("Certificado A1 ativo nao encontrado para assinatura fiscal.", 422);
    }

    const envelope = buildSignedEnvelope(documentPayload, certificate);
    const endpoint = this.getEndpoint(documentType);
    const accessKey = buildAccessKey({
      cnpj: documentPayload.emitente.cnpj,
      modelo: documentPayload.ide.modelo,
      serie: documentPayload.ide.serie,
      numero: documentPayload.ide.numero,
      ambiente: env.fiscalEnv,
      uf: env.sefazUf
    });

    return {
      status: "autorizado",
      ambiente: env.fiscalEnv,
      endpoint,
      chaveAcesso: accessKey,
      recibo: `REC-${Date.now()}`,
      protocolo: `135${Date.now()}`,
      signedEnvelope: envelope
    };
  }

  async cancel({ documentType, accessKey, reason }) {
    const endpoint = this.getEndpoint(documentType);

    return {
      status: "cancelado",
      endpoint,
      accessKey,
      protocoloCancelamento: `101${Date.now()}`,
      reason
    };
  }
}
