import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './db';
import authRoutes from './authRoutes';
import { errorHandler } from './errorHandler';

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', server: 'main' }));
app.use('/auth', authRoutes);

// ── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Boot ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () =>
    console.log(`🚀 Main server running on http://localhost:${PORT}`)
  );
}

start().catch(console.error);

export default app;