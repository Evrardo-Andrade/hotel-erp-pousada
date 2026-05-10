import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requireRole } from "../../middleware/auth.js";
import { AuthService } from "./auth-service.js";

const authService = new AuthService();
const router = Router();

router.post("/login", async (request, response) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
  });

  const data = schema.parse(request.body);
  const session = await authService.login(data.email, data.password);
  return response.json(session);
});

router.post("/logout", authMiddleware, async (_request, response) => {
  return response.status(204).send();
});

router.get("/me", authMiddleware, async (request, response) => {
  const user = await authService.me(request.user.id);
  return response.json({ user });
});

router.post("/register", authMiddleware, requireRole(["admin"]), async (request, response) => {
  const schema = z.object({
    nome: z.string().trim().min(2).max(150),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.string().min(2).max(50),
    ativo: z.boolean().optional()
  });

  const data = schema.parse(request.body);
  const user = await authService.register(data);
  return response.status(201).json({ user });
});

router.put("/change-password", authMiddleware, async (request, response) => {
  const schema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8)
  });

  const data = schema.parse(request.body);
  await authService.changePassword(request.user.id, data.currentPassword, data.newPassword);
  return response.json({ ok: true });
});

export { router as authRoutes };
