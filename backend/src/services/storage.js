import { Storage } from "@google-cloud/storage";
import crypto from "crypto";
import path from "path";

const SIDECAR = "http://127.0.0.1:1106";

const gcs = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});

function parsePath(fullPath) {
  if (!fullPath.startsWith("/")) fullPath = `/${fullPath}`;
  const parts = fullPath.split("/");
  return { bucketName: parts[1], objectName: parts.slice(2).join("/") };
}

function getPublicBasePath() {
  const paths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paths.length) throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not configured");
  return paths[0].replace(/\/$/, "");
}

function getPrivateBasePath() {
  const dir = (process.env.PRIVATE_OBJECT_DIR || "").replace(/\/$/, "");
  if (!dir) throw new Error("PRIVATE_OBJECT_DIR not configured");
  return dir;
}

export async function uploadPublicFile(buffer, originalFilename, mimetype) {
  const ext = path.extname(originalFilename || "").toLowerCase() || ".bin";
  const uuid = crypto.randomUUID();
  const objectSuffix = `products/${uuid}${ext}`;
  const fullPath = `${getPublicBasePath()}/${objectSuffix}`;
  const { bucketName, objectName } = parsePath(fullPath);

  await gcs.bucket(bucketName).file(objectName).save(buffer, {
    contentType: mimetype,
    resumable: false
  });

  return {
    storageKey: `public:${objectSuffix}`,
    imageUrl: `/api/products/image/${encodeURIComponent(`public:${objectSuffix}`)}`
  };
}

export async function uploadPrivateFile(buffer, originalFilename, mimetype) {
  const ext = path.extname(originalFilename || "").toLowerCase() || ".bin";
  const uuid = crypto.randomUUID();
  const objectSuffix = `guests/${uuid}${ext}`;
  const fullPath = `${getPrivateBasePath()}/${objectSuffix}`;
  const { bucketName, objectName } = parsePath(fullPath);

  await gcs.bucket(bucketName).file(objectName).save(buffer, {
    contentType: mimetype,
    resumable: false
  });

  return {
    storageKey: `private:${objectSuffix}`
  };
}

export async function streamFileToResponse(storageKey, res) {
  let fullPath;

  if (storageKey.startsWith("public:")) {
    fullPath = `${getPublicBasePath()}/${storageKey.slice(7)}`;
  } else if (storageKey.startsWith("private:")) {
    fullPath = `${getPrivateBasePath()}/${storageKey.slice(8)}`;
  } else {
    res.status(400).json({ message: "Chave de armazenamento invalida." });
    return;
  }

  const { bucketName, objectName } = parsePath(fullPath);
  const file = gcs.bucket(bucketName).file(objectName);

  const [exists] = await file.exists();
  if (!exists) {
    res.status(404).json({ message: "Arquivo nao encontrado." });
    return;
  }

  const [metadata] = await file.getMetadata();
  const isPublic = storageKey.startsWith("public:");

  res.set({
    "Content-Type": metadata.contentType || "application/octet-stream",
    "Cache-Control": isPublic ? "public, max-age=86400" : "private, no-store, no-cache"
  });

  if (metadata.size) {
    res.set("Content-Length", String(metadata.size));
  }

  file.createReadStream().on("error", (err) => {
    console.error("Storage stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Erro ao transmitir arquivo." });
    }
  }).pipe(res);
}

export async function deleteStorageFile(storageKey) {
  if (!storageKey) return;

  let fullPath;
  if (storageKey.startsWith("public:")) {
    fullPath = `${getPublicBasePath()}/${storageKey.slice(7)}`;
  } else if (storageKey.startsWith("private:")) {
    fullPath = `${getPrivateBasePath()}/${storageKey.slice(8)}`;
  } else {
    return;
  }

  const { bucketName, objectName } = parsePath(fullPath);
  try {
    await gcs.bucket(bucketName).file(objectName).delete();
  } catch (err) {
    if (err.code !== 404) {
      console.error("Storage delete error:", err);
    }
  }
}