import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { dashboardAuth } from './dashboardAuthRoutes';

export const statsRouter = Router();

statsRouter.get('/', dashboardAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.sub;

    // Summary counts, scoped to this user's webhook logs only
    const summaryQuery = pool.query(
      `SELECT
         COUNT(*)::text AS total_events,
         COUNT(*) FILTER (WHERE wl.status = 'success')::text AS delivered,
         COUNT(*) FILTER (WHERE wl.status = 'failed')::text  AS failed,
         COUNT(*) FILTER (WHERE wl.status = 'pending')::text AS pending
       FROM webhook_logs wl
       JOIN webhook_endpoints we ON we.id = wl.endpoint_id
       WHERE we.dashboard_user_id = $1`,
      [userId]
    );

    // Average response time across delivered deliveries for this user's logs
    const avgQuery = pool.query(
      `SELECT ROUND(AVG(wd.response_time))::text AS avg_ms
       FROM webhook_deliveries wd
       JOIN webhook_logs wl ON wl.id = wd.log_id
       JOIN webhook_endpoints we ON we.id = wl.endpoint_id
       WHERE we.dashboard_user_id = $1 AND wd.response_time IS NOT NULL`,
      [userId]
    );

    // Breakdown by event type
    const breakdownQuery = pool.query(
      `SELECT wl.event_type, COUNT(*)::text AS count
       FROM webhook_logs wl
       JOIN webhook_endpoints we ON we.id = wl.endpoint_id
       WHERE we.dashboard_user_id = $1
       GROUP BY wl.event_type
       ORDER BY COUNT(*) DESC`,
      [userId]
    );

    // Most recent 20 events, with their latest delivery attempt info if any
    const recentQuery = pool.query(
      `SELECT
         wl.id,
         wl.event_type,
         wl.status,
         wl.created_at,
         latest.response_time,
         latest.attempt
       FROM webhook_logs wl
       JOIN webhook_endpoints we ON we.id = wl.endpoint_id
       LEFT JOIN LATERAL (
         SELECT response_time, attempt
         FROM webhook_deliveries wd
         WHERE wd.log_id = wl.id
         ORDER BY wd.attempt DESC
         LIMIT 1
       ) latest ON true
       WHERE we.dashboard_user_id = $1
       ORDER BY wl.created_at DESC
       LIMIT 20`,
      [userId]
    );

    const [summaryRes, avgRes, breakdownRes, recentRes] = await Promise.all([
      summaryQuery, avgQuery, breakdownQuery, recentQuery,
    ]);

    return res.json({
      summary: summaryRes.rows[0] ?? { total_events: '0', delivered: '0', failed: '0', pending: '0' },
      avgResponseMs: avgRes.rows[0]?.avg_ms ?? null,
      eventBreakdown: breakdownRes.rows,
      recentActivity: recentRes.rows,
    });
  } catch (err) {
    next(err);
  }
});