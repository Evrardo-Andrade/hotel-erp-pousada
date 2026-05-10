import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { applySecurity, attachRequestContext, basicRateLimit } from "./middleware/security.js";

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

applySecurity(app);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://hotel-erp-frontend.onrender.com",
  "https://hotel-erp-pousada.onrender.com",
  env.appUrl
].filter(Boolean));

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"]
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(attachRequestContext);
app.use(basicRateLimit());
app.use("/uploads", express.static(path.resolve(__dirname, "..", "..", "uploads")));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);
app.use(errorHandler);
