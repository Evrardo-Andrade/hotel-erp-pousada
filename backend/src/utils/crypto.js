import crypto from "crypto";
import { env } from "../config/env.js";

const algorithm = "aes-256-cbc";
const key = crypto.createHash("sha256").update(env.jwtSecret).digest();

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}
