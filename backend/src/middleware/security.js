import crypto from "crypto";
import { env } from "../config/env.js";

const requestLog = new Map();

export function applySecurity(app) {
  if (env.trustProxy) {
    app.set("trust proxy", 1);
  }
}

export function attachRequestContext(request, response, next) {
  request.requestId = crypto.randomUUID();
  response.setHeader("X-Request-Id", request.requestId);
  next();
}

export function basicRateLimit({ windowMs = 60_000, max = 120 } = {}) {
  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip || request.headers["x-forwarded-for"] || "local";
    const current = requestLog.get(key) || [];
    const validHits = current.filter((timestamp) => now - timestamp < windowMs);

    validHits.push(now);
    requestLog.set(key, validHits);

    if (validHits.length > max) {
      return response.status(429).json({
        message: "Limite de requisicoes excedido. Tente novamente em instantes."
      });
    }

    return next();
  };
}
