import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { webhookQueue } from '../webhookQueue';
import { verifySignature } from '../verify';

const router = Router();

// POST /webhooks/ingest/:webhookId
router.post('/:webhookId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { webhookId } = req.params;
    console.log(`📥 Received webhook for ${webhookId}`);
    // 1. Fetch endpoint + secret
    const { rows } = await pool.query(
      `SELECT * FROM webhook_endpoints
       WHERE webhook_id = $1 AND status = 'active'`,
      [webhookId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Endpoint not found' });

    // 2. Verify HMAC
    try {
      verifySignature(req, rows[0].secret);
    } catch {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 3. Persist log immediately
    const { rows: logRows } = await pool.query(
      `INSERT INTO webhook_logs (endpoint_id, event_type, payload, headers, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [
        rows[0].id,
        req.body.event || 'unknown',
        JSON.stringify(req.body),
        JSON.stringify(req.headers),
      ]
    );
    const logId = logRows[0].id;

    // 4. Enqueue delivery job
    await webhookQueue.add('deliver', {
      logId,
      endpointId: rows[0].id,
      payload:    req.body,
    });

    return res.status(202).json({ received: true, logId });
  } catch (err) {
    next(err);
  }
});

export default router;