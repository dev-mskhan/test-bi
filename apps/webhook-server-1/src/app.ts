import express from "express";
import cors from "cors";
import webhookRoutes from "./routes/webhook.routes";

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5001")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: corsOrigins,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "webhook-server-1" });
});

app.use("/webhooks", webhookRoutes);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

export default app;
