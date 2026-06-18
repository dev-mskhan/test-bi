import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';

const router = Router();

// GET /api/logs?page=1&limit=20&event=user.login&status=success
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[]    = [];
    let   idx = 1;

    if (req.query.event) {
      conditions.push(`l.event_type = $${idx++}`);
      params.push(req.query.event);
    }
    if (req.query.status) {
      conditions.push(`l.status = $${idx++}`);
      params.push(req.query.status);
    }
    if (req.query.endpointId) {
      conditions.push(`l.endpoint_id = $${idx++}`);
      params.push(req.query.endpointId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM webhook_logs l ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT l.id, l.event_type, l.status, l.created_at,
              e.webhook_id, e.name AS endpoint_name,
              l.payload->'data'->>'email' AS user_email,
              l.payload->'data'->>'name' AS user_name,
              l.payload->>'data' AS data_preview
       FROM webhook_logs l
       JOIN webhook_endpoints e ON e.id = l.endpoint_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );

    return res.json({
      logs: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/logs/:id — full log detail
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*,
              e.webhook_id, e.name AS endpoint_name,
              l.payload->'data'->>'email' AS user_email,
              l.payload->'data'->>'name' AS user_name,
              COALESCE(
                json_agg(
                  d ORDER BY d.attempt
                ) FILTER (WHERE d.id IS NOT NULL),
                '[]'
              ) AS deliveries
       FROM webhook_logs l
       JOIN webhook_endpoints e ON e.id = l.endpoint_id
       LEFT JOIN webhook_deliveries d ON d.log_id = l.id
       WHERE l.id = $1
       GROUP BY l.id, e.webhook_id, e.name`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Log not found' });
    return res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;