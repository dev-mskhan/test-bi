import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();
import { statsRouter } from './routes/dashboardStatsRoutes';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './db';
import { authRouter, dashboardAuth } from './routes/dashboardAuthRoutes';
import ingestRoutes    from './routes/ingestRoutes';
import logRoutes       from './routes/logRoutes';
import deliveryRoutes  from './routes/deliveryRoutes';
import { startWorker, setSocketServer } from './deliveryWorker';

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin:      process.env.DASHBOARD_URL || 'http://localhost:3001',
    credentials: true,
  },
});
setSocketServer(io);

io.on('connection', (socket) => {
  console.log(`🔌 Dashboard connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Dashboard disconnected: ${socket.id}`));
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.DASHBOARD_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser(process.env.JWT_ACCESS_SECRET)); 

// ── Public routes ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', server: 'webhook' }));
app.use('/webhooks/ingest', ingestRoutes);     // called by main-server
app.use('/auth',            authRouter);   
// ── Protected dashboard API ──────────────────────────────────────────────────
app.use('/api/logs',       dashboardAuth, logRoutes);
app.use('/api/deliveries', dashboardAuth, deliveryRoutes);
app.use('/api/stats',      dashboardAuth, statsRouter);

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.message);
  const statusMap: Record<string, number> = {
    'Email already registered': 409,
    'Invalid credentials':       401,
    'Invalid signature':         401,
    'Invalid or expired refresh token': 401,
  };
  res.status(statusMap[err.message] ?? 500).json({ error: err.message });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  startWorker();
  server.listen(PORT, () =>
    console.log(`🚀 Webhook server running on http://localhost:${PORT}`)
  );
}

start().catch(console.error);

export default app;