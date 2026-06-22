import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import { pinoHttp } from "pino-http";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { logger } from "./services/logger";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes/index";
import { swaggerSpec } from "./docs/swagger";

const app = express();

// Trust proxy
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);
app.use(
  cors({
    origin: ["http://localhost:3002"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser(process.env.JWT_ACCESS_SECRET!));
app.use(compression());

app.use(
  pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many auth attempts",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    statusCode: 429,
    message: "Analysis rate limit: 5 per minute",
  },
});
// Apply limiter only to POST /api/analysis
app.use("/api/analysis", (req, res, next) => {
  if (req.method === "POST")
    return analysisLimiter(req as any, res as any, next as any);
  return next();
});

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "BI Platform API",
    swaggerOptions: { persistAuthorization: true },
  }),
);
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

app.use("/api", routes);

app.use((_req, res) =>
  res
    .status(404)
    .json({ success: false, statusCode: 404, message: "Route not found" }),
);

app.use(errorHandler);

export default app;
