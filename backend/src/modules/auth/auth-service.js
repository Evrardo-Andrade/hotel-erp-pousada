import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../../config/database.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

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
    "orders.read",
    "finance.read"
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
    "finance.read",
    "fiscal.emit"
  ]
};

export class AuthService {
  async login(email, password) {
    const result = await query(
      `SELECT id, nome, email, senha_hash, papel
       FROM usuarios
       WHERE email = $1 AND ativo = true`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.senha_hash);

    if (!passwordMatches) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.papel,
        permissions: rolePermissions[user.papel] || []
      },
      env.jwtSecret,
      { expiresIn: "12h" }
    );

    return {
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        papel: user.papel,
        permissoes: rolePermissions[user.papel] || []
      }
    };
  }
}
