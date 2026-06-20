import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import formRouter from "./routes/form";
console.log("port:", process.env.PORT);
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/form", formRouter);

// Baaki sab requests frontend ko
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
  console.log(`🚀 Webhook-service running on :${PORT}`);
  console.log(`📌 NGROK URL: ${process.env.NGROK_URL || "not set"}`);
  console.log(`📌 Main server: ${process.env.MAIN_SERVER_URL}`);
});