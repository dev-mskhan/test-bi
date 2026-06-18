import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from './db';

const ACCESS_SECRET   = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

export interface AuthUser {
  id:    string;
  email: string;
  name:  string;
  role:  string;
}

function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions
  );
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, role`,
    [email.toLowerCase().trim(), hash, name.trim()]
  );

  const user   = rows[0] as AuthUser;
  const tokens = await createTokenPair(user);
  return { user, tokens };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const { rows } = await pool.query(
    `SELECT id, email, name, role, password_hash, is_active
     FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  const row = rows[0];
  if (!row) throw new Error('Invalid credentials');
  if (!row.is_active) throw new Error('Account disabled');

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) throw new Error('Invalid credentials');

  const user: AuthUser = { id: row.id, email: row.email, name: row.name, role: row.role };
  const tokens = await createTokenPair(user);
  return { user, tokens };
}

export async function refreshTokens(rawToken: string): Promise<TokenPair> {
  const tokenHash = hashToken(rawToken);
  const { rows } = await pool.query(
    `SELECT rt.*, u.id as uid, u.email, u.name, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.expires_at > now()`,
    [tokenHash]
  );
  if (!rows[0]) throw new Error('Invalid or expired refresh token');

  // Rotate: delete old, issue new
  await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [rows[0].id]);
  const user: AuthUser = {
    id: rows[0].uid, email: rows[0].email,
    name: rows[0].name, role: rows[0].role,
  };
  return createTokenPair(user);
}

export async function logoutUser(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const { rows } = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1', [userId]
  );
  if (!rows[0]) throw new Error('User not found');

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) throw new Error('Current password is incorrect');

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
    [hash, userId]
  );
  // Invalidate all refresh tokens
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

export async function deleteUser(userId: string): Promise<void> {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

export function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function createTokenPair(user: AuthUser): Promise<TokenPair> {
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash    = hashToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  return { accessToken, refreshToken };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}