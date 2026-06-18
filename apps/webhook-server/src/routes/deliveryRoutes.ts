import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';

const router = Router();

// GET /api/deliveries?logId=...&status=...
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (req.query.logId) {
      conditions.push(`d.log_id = $${idx++}`);
      params.push(req.query.logId);
    }
    if (req.query.status) {
      conditions.push(`d.status = $${idx++}`);
      params.push(req.query.status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT d.*, l.event_type, l.status AS log_status,
              l.payload->'data'->>'email' AS user_email,
              l.payload->'data'->>'name' AS user_name
       FROM webhook_deliveries d
       JOIN webhook_logs l ON l.id = d.log_id
       ${where}
       ORDER BY d.created_at DESC
       LIMIT 100`,
      params
    );

    return res.json({ deliveries: rows });
  } catch (err) {
    next(err);
  }
});

export default router;