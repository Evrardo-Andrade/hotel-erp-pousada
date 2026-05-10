import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../../config/database.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { buildPermissions } from "./role-permissions.js";

function normalizeUserRow(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.papel,
    ativo: user.ativo,
    permissions: buildPermissions(user.papel),
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

export class AuthService {
  async findUserByEmail(email) {
    const result = await query(
      `SELECT id, nome, email, senha_hash, papel, ativo, created_at, updated_at
       FROM usuarios
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    return result.rows[0] || null;
  }

  async findUserById(id) {
    const result = await query(
      `SELECT id, nome, email, senha_hash, papel, ativo, created_at, updated_at
       FROM usuarios
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return result.rows[0] || null;
  }

  issueToken(user) {
    return jwt.sign(
      {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.papel,
        permissions: buildPermissions(user.papel)
      },
      env.jwtSecret,
      { expiresIn: "12h" }
    );
  }

  async login(email, password) {
    const user = await this.findUserByEmail(email);

    if (!user || !user.ativo) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.senha_hash);

    if (!passwordMatches) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    return {
      token: this.issueToken(user),
      user: normalizeUserRow(user)
    };
  }

  async me(userId) {
    const user = await this.findUserById(userId);

    if (!user || !user.ativo) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    return normalizeUserRow(user);
  }

  async register(payload) {
    const existing = await this.findUserByEmail(payload.email);

    if (existing) {
      throw new AppError("Ja existe um usuario com este e-mail.", 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const result = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, papel, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, senha_hash, papel, ativo, created_at, updated_at`,
      [
        payload.nome,
        payload.email.toLowerCase(),
        passwordHash,
        payload.role,
        payload.ativo ?? true
      ]
    );

    return normalizeUserRow(result.rows[0]);
  }

  async updateProfile(userId, payload) {
    const user = await this.findUserById(userId);

    if (!user || !user.ativo) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    const normalizedEmail = payload.email.toLowerCase();
    const existing = await this.findUserByEmail(normalizedEmail);

    if (existing && existing.id !== userId) {
      throw new AppError("Ja existe um usuario com este e-mail.", 409);
    }

    const result = await query(
      `UPDATE usuarios
       SET nome = $2,
           email = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, nome, email, senha_hash, papel, ativo, created_at, updated_at`,
      [userId, payload.nome, normalizedEmail]
    );

    return normalizeUserRow(result.rows[0]);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.findUserById(userId);

    if (!user || !user.ativo) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.senha_hash);

    if (!passwordMatches) {
      throw new AppError("Senha atual invalida.", 401);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE usuarios
       SET senha_hash = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, newPasswordHash]
    );

    return { ok: true };
  }
}
