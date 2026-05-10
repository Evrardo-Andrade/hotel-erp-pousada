import crypto from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

let supabaseAdmin = null;

function ensureStorageEnv() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new AppError(
      "Supabase Storage nao configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
      500
    );
  }
}

function getSupabaseAdmin() {
  ensureStorageEnv();

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseAdmin;
}

function buildStorageError(message, error, statusCode = 500) {
  const appError = new AppError(message, statusCode);
  appError.code = "STORAGE_ERROR";
  appError.details = error?.message || null;
  return appError;
}

function getFileExtension(originalFilename = "") {
  return path.extname(originalFilename).toLowerCase() || ".bin";
}

function resolveLocation(storageKey, bucketName = null) {
  if (!storageKey) {
    throw new AppError("Chave de armazenamento invalida.", 400);
  }

  if (bucketName) {
    return {
      bucketName,
      objectKey: storageKey.replace(/^(public:|private:)/, ""),
      isPublic: bucketName === env.supabasePublicBucket
    };
  }

  if (storageKey.startsWith("public:")) {
    return {
      bucketName: env.supabasePublicBucket,
      objectKey: storageKey.slice("public:".length),
      isPublic: true
    };
  }

  if (storageKey.startsWith("private:")) {
    return {
      bucketName: env.supabasePrivateBucket,
      objectKey: storageKey.slice("private:".length),
      isPublic: false
    };
  }

  throw new AppError("Chave de armazenamento invalida.", 400);
}

export async function uploadPublicFile(buffer, originalFilename, mimetype, options = {}) {
  const folder = options.folder || "products";
  const objectKey = `${folder}/${crypto.randomUUID()}${getFileExtension(originalFilename)}`;
  const client = getSupabaseAdmin();
  const bucket = env.supabasePublicBucket;

  const { error } = await client.storage.from(bucket).upload(objectKey, buffer, {
    contentType: mimetype,
    upsert: false,
    cacheControl: "3600"
  });

  if (error) {
    throw buildStorageError("Nao foi possivel enviar a imagem do produto.", error);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectKey);

  return {
    storageKey: `public:${objectKey}`,
    bucketName: bucket,
    imageUrl: data?.publicUrl || null
  };
}

export async function uploadPrivateFile(buffer, originalFilename, mimetype, options = {}) {
  const folder = options.folder || "guests";
  const objectKey = `${folder}/${crypto.randomUUID()}${getFileExtension(originalFilename)}`;
  const client = getSupabaseAdmin();
  const bucket = env.supabasePrivateBucket;

  const { error } = await client.storage.from(bucket).upload(objectKey, buffer, {
    contentType: mimetype,
    upsert: false,
    cacheControl: "0"
  });

  if (error) {
    throw buildStorageError("Nao foi possivel enviar o documento do hospede.", error);
  }

  return {
    storageKey: `private:${objectKey}`,
    bucketName: bucket
  };
}

export async function streamFileToResponse(storageKey, res, options = {}) {
  const { bucketName, objectKey, isPublic } = resolveLocation(storageKey, options.bucketName);
  const client = getSupabaseAdmin();
  const { data, error } = await client.storage.from(bucketName).download(objectKey);

  if (error || !data) {
    const notFound = error?.statusCode === "404" || error?.status === 404;
    if (!res.headersSent) {
      res.status(notFound ? 404 : 500).json({
        message: notFound ? "Arquivo nao encontrado." : "Erro ao transmitir arquivo."
      });
    }
    return;
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  res.set({
    "Content-Type": data.type || "application/octet-stream",
    "Content-Length": String(buffer.length),
    "Cache-Control": isPublic ? "public, max-age=86400" : "private, no-store, no-cache"
  });

  res.send(buffer);
}

export async function deleteStorageFile(storageKey, options = {}) {
  if (!storageKey) {
    return;
  }

  const { bucketName, objectKey } = resolveLocation(storageKey, options.bucketName);
  const client = getSupabaseAdmin();
  const { error } = await client.storage.from(bucketName).remove([objectKey]);

  if (error && !String(error.message || "").toLowerCase().includes("not found")) {
    console.error("Storage delete error:", error);
  }
}
