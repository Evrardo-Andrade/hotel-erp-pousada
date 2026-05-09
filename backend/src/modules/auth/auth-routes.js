import { Router } from "express";
import { z } from "zod";
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

export { router as authRoutes };
