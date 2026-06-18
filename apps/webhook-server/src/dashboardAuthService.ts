import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from './db';

const ACCESS_SECRET   = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET!; // kept for env validation; refresh tokens themselves are opaque random strings, not JWTs
const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  || '15m';
const REFRESH_EXPIRES_MS = parseExpiryToMs(process.env.JWT_REFRESH_EXPIRES || '7d');

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set');
}

export async function dashboardRegister(email: string, password: string, name: string, webhookName: string) {
  const existing = await pool.query(
    'SELECT id FROM dashboard_users WHERE email = $1', [email.toLowerCase().trim()]
  );
  if (existing.rows.length > 0) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO dashboard_users (email, password_hash, name)
     VALUES ($1, $2, $3) RETURNING id, email, name`,
    [email.toLowerCase().trim(), hash, name.trim()]
  );
  const user = rows[0];

  const webhook_id = 'wh_' + crypto.randomBytes(8).toString('hex');
  const webhook_secret = crypto.randomBytes(32).toString('hex');

  await pool.query(
    `INSERT INTO webhook_endpoints (webhook_id, name, secret, dashboard_user_id)
     VALUES ($1, $2, $3, $4)`,
    [webhook_id, webhookName.trim(), webhook_secret, user.id]
  );

  const tokens = await buildTokenPair(user);
  return { user, tokens, endpoint: { webhook_id, webhook_secret } };
}

export async function dashboardLogin(email: string, password: string) {
  const { rows } = await pool.query(
    `SELECT id, email, name, password_hash
     FROM dashboard_users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  if (!rows[0]) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) throw new Error('Invalid credentials');

  const user = { id: rows[0].id, email: rows[0].email, name: rows[0].name };
  const endpoint = await getEndpointForUser(user.id);
  const tokens = await buildTokenPair(user);
  return { user, tokens, endpoint };
}

export async function dashboardRefresh(rawToken: string) {
  const hash = hashToken(rawToken);
  const { rows } = await pool.query(
    `SELECT rt.id, u.id AS uid, u.email, u.name
     FROM dashboard_refresh_tokens rt
     JOIN dashboard_users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.expires_at > now()`,
    [hash]
  );
  if (!rows[0]) throw new Error('Invalid or expired refresh token');

  // Rotate: delete the used token immediately so it can't be replayed
  await pool.query('DELETE FROM dashboard_refresh_tokens WHERE id = $1', [rows[0].id]);

  const user = { id: rows[0].uid, email: rows[0].email, name: rows[0].name };
  const endpoint = await getEndpointForUser(user.id);
  const tokens = await buildTokenPair(user);
  return { user, tokens, endpoint };
}

export async function dashboardLogout(rawToken: string) {
  const hash = hashToken(rawToken);
  await pool.query('DELETE FROM dashboard_refresh_tokens WHERE token_hash = $1', [hash]);
}

export async function getDashboardUser(userId: string) {
  const { rows } = await pool.query(
    'SELECT id, email, name FROM dashboard_users WHERE id = $1',
    [userId]
  );
  if (!rows[0]) throw new Error('User not found');
  const user = rows[0];
  const endpoint = await getEndpointForUser(user.id);
  return { user, endpoint };
}

export function verifyDashboardToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
}

async function getEndpointForUser(userId: string) {
  const { rows } = await pool.query(
    `SELECT webhook_id, secret as webhook_secret FROM webhook_endpoints WHERE dashboard_user_id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function buildTokenPair(user: { id: string; email: string; name: string }) {
  const accessToken  = jwt.sign(
    { sub: user.id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions
  );
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash    = hashToken(refreshToken);
  const expiresAt    = new Date(Date.now() + REFRESH_EXPIRES_MS);

  // Cap concurrent sessions per user; drop oldest if over limit (optional but recommended)
  await pool.query(
    `INSERT INTO dashboard_refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  return { accessToken, refreshToken };
}

function hashToken(t: string) {
  return crypto.createHash('sha256').update(t).digest('hex');
}

// Parses simple durations like '7d', '15m', '12h', '30s' into milliseconds.
function parseExpiryToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days
  const num = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return num * unitMs;
}