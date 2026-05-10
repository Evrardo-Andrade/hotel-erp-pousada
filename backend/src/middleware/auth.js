import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { buildPermissions } from "../modules/auth/role-permissions.js";

function hasPermission(granted, required) {
  if (granted.includes("*") || granted.includes(required)) {
    return true;
  }

  if (required.endsWith(".read")) {
    const scope = required.replace(".read", ".manage");
    return granted.includes(scope);
  }

  return false;
}

export function authenticate(request, response, next) {
  const authHeader = request.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({
      message: "Token nao informado.",
      code: "AUTH_TOKEN_MISSING"
    });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    request.user = {
      ...payload,
      permissions: payload.permissions?.length
        ? payload.permissions
        : buildPermissions(payload.role)
    };
    return next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return response.status(401).json({
        message: "Sessao expirada. Faca login novamente.",
        code: "AUTH_TOKEN_EXPIRED"
      });
    }

    return response.status(401).json({
      message: "Token invalido.",
      code: "AUTH_TOKEN_INVALID"
    });
  }
}

export function requireRole(roles = []) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (request, response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return response.status(403).json({ message: "Acesso negado." });
    }

    return next();
  };
}

export const authMiddleware = authenticate;
export const authorize = (...roles) => requireRole(roles);

export function authorizePermission(...permissions) {
  return (request, response, next) => {
    const granted = request.user?.permissions || [];
    const allowed =
      granted.includes("*") || permissions.every((permission) => hasPermission(granted, permission));

    if (!allowed) {
      return response.status(403).json({ message: "Permissao insuficiente para esta operacao." });
    }

    return next();
  };
}
