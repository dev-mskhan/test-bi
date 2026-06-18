import { Worker, Job } from 'bullmq';
import { redisConnection } from './redis'
import { pool } from './db';
import { Server as SocketServer } from 'socket.io';

export interface DeliveryJobData {
  logId:      string;
  endpointId: string;
  payload:    Record<string, unknown>;
  targetUrl?: string;
}

let io: SocketServer | null = null;

export function setSocketServer(server: SocketServer) {
  io = server;
}

function broadcast(event: string, data: unknown) {
  if (io) io.emit(event, data);
}

export function startWorker() {
  const worker = new Worker<DeliveryJobData>(
    'webhooks',
    async (job: Job<DeliveryJobData>) => {
      const { logId, payload } = job.data;
      const attempt = (job.attemptsMade ?? 0) + 1;

      // Insert delivery row
      const { rows } = await pool.query(
        `INSERT INTO webhook_deliveries (log_id, attempt, status)
         VALUES ($1, $2, 'processing') RETURNING id`,
        [logId, attempt]
      );
      const deliveryId = rows[0].id;

      broadcast('delivery:update', { logId, deliveryId, status: 'processing', attempt });

      const start = Date.now();
      let responseStatus: number | null = null;
      let responseBody   = '';
      let errorMessage   = '';

      try {
        // In production: POST to the registered target URL
        // For now we simulate a successful delivery after a small delay
        await new Promise((r) => setTimeout(r, 200));
        responseStatus = 200;
        responseBody   = JSON.stringify({ received: true });

        const ms = Date.now() - start;

        await pool.query(
          `UPDATE webhook_deliveries
           SET status='delivered', response_status=$1, response_body=$2,
               response_time=$3, delivered_at=now()
           WHERE id=$4`,
          [responseStatus, responseBody, ms, deliveryId]
        );

        await pool.query(
          `UPDATE webhook_logs SET status='success' WHERE id=$1`,
          [logId]
        );

        broadcast('delivery:update', {
          logId, deliveryId, status: 'delivered',
          attempt, responseStatus, responseTime: ms,
        });

        broadcast('log:update', { logId, status: 'success' });
      } catch (err: any) {
        errorMessage = err?.message || 'Unknown error';
        const isFinal = attempt >= 5;
        const newStatus = isFinal ? 'failed' : 'retrying';

        await pool.query(
          `UPDATE webhook_deliveries
           SET status=$1, error_message=$2, response_status=$3
           WHERE id=$4`,
          [newStatus, errorMessage, responseStatus, deliveryId]
        );

        if (isFinal) {
          await pool.query(
            `UPDATE webhook_logs SET status='failed' WHERE id=$1`, [logId]
          );
          broadcast('log:update', { logId, status: 'failed' });
        }

        broadcast('delivery:update', {
          logId, deliveryId, status: newStatus, attempt, errorMessage,
        });

        throw err; // Let BullMQ handle retry schedule
      }
    },
    { connection: redisConnection.connection, concurrency: 10 }
  );

  worker.on('error', (err) => console.error('Worker error:', err));
  console.log('⚙️  Delivery worker started');
  return worker;
}