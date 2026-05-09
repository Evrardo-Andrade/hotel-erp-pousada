import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const rolePermissions = {
  admin: ["*"],
  gerente: [
    "dashboard.read",
    "rooms.read",
    "rooms.manage",
    "reservations.read",
    "reservations.manage",
    "guests.read",
    "guests.manage",
    "stay.read",
    "stay.manage",
    "products.read",
    "products.manage",
    "pos.read",
    "pos.manage",
    "orders.read",
    "orders.manage",
    "finance.read",
    "finance.manage",
    "fiscal.emit",
    "fiscal.cancel",
    "settings.read",
    "settings.manage",
    "logs.read"
  ],
  recepcao: [
    "dashboard.read",
    "rooms.read",
    "reservations.manage",
    "guests.manage",
    "stay.manage",
    "pos.read",
    "orders.read",
    "finance.read"
  ],
  supervisor: [
    "dashboard.read",
    "products.read",
    "pos.read",
    "pos.manage",
    "orders.read",
    "orders.manage",
    "finance.read",
    "finance.manage",
    "fiscal.emit",
    "fiscal.cancel",
    "logs.read"
  ],
  fiscal: [
    "dashboard.read",
    "finance.read",
    "fiscal.emit",
    "fiscal.cancel",
    "settings.read",
    "logs.read"
  ],
  caixa: [
    "dashboard.read",
    "products.read",
    "pos.read",
    "pos.manage",
    "orders.read",
    "orders.manage",
    "finance.read",
    "fiscal.emit"
  ]
};

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
  const [, token] = (request.headers.authorization || "").split(" ");

  if (!token) {
    return response.status(401).json({ message: "Token nao informado." });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    request.user = {
      ...payload,
      permissions: payload.permissions?.length
        ? payload.permissions
        : rolePermissions[payload.role] || []
    };
    return next();
  } catch (error) {
    return response.status(401).json({ message: "Token invalido." });
  }
}

export function authorize(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ message: "Acesso negado." });
    }

    return next();
  };
}

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
