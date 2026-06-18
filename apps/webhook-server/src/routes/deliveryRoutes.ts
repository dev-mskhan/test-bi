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
      `SELECT d.*, l.event_type, l.status AS log_status
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

// GET /api/stats — dashboard summary
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: summary } = await pool.query(`
      SELECT
        COUNT(*)                                             AS total_events,
        COUNT(*) FILTER (WHERE status = 'success')          AS delivered,
        COUNT(*) FILTER (WHERE status = 'failed')           AS failed,
        COUNT(*) FILTER (WHERE status = 'pending')          AS pending
      FROM webhook_logs
    `);

    const { rows: avgRow } = await pool.query(`
      SELECT ROUND(AVG(response_time)) AS avg_response_ms
      FROM webhook_deliveries
      WHERE status = 'delivered'
    `);

    const { rows: byEvent } = await pool.query(`
      SELECT event_type, COUNT(*) AS count
      FROM webhook_logs
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const { rows: recent } = await pool.query(`
      SELECT l.id, l.event_type, l.status, l.created_at,
             d.response_time, d.attempt
      FROM webhook_logs l
      LEFT JOIN webhook_deliveries d
        ON d.log_id = l.id AND d.status = 'delivered'
      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    return res.json({
      summary:         summary[0],
      avgResponseMs:   avgRow[0]?.avg_response_ms ?? null,
      eventBreakdown:  byEvent,
      recentActivity:  recent,
    });
  } catch (err) {
    next(err);
  }
});

export default router;