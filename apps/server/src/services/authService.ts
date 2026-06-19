import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "./prisma";
import { ApiError } from "../utils/ApiError";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set");
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  webhook_id?: string;
  webhook_secret?: string;
}

function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions,
  );
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createTokenPair(user: AuthUser): Promise<TokenPair> {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refresh_tokens.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role?: string,
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const existing = await prisma.users.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) throw new ApiError(409, "Email already registered");

  const password_hash = await bcrypt.hash(password, 12);

  const webhook_id = `wh_${crypto.randomUUID()}`;
  const webhook_secret = crypto.randomBytes(32).toString("hex");

  const created = await prisma.users.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password_hash,
      role: (role ?? "viewer") as any,
      webhook_id,
      webhook_secret,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  const user: AuthUser = {
    id: created.id,
    email: created.email,
    name: created.name,
    role: created.role,
    webhook_id,
    webhook_secret,
  };
  const tokens = await createTokenPair(user);
  return { user, tokens };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const found = await prisma.users.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!found || !found.is_active)
    throw new ApiError(401, "Invalid credentials");

  const valid = await bcrypt.compare(password, found.password_hash);
  if (!valid) throw new ApiError(401, "Invalid credentials");

  const user: AuthUser = {
    id: found.id,
    email: found.email,
    name: found.name,
    role: found.role,
    webhook_id: found.webhook_id || undefined,
    webhook_secret: found.webhook_secret || undefined,
  };
  const tokens = await createTokenPair(user);
  return { user, tokens };
}

export async function refreshTokens(rawToken: string): Promise<TokenPair> {
  const tokenHash = hashToken(rawToken);

  const stored = await prisma.refresh_tokens.findFirst({
    where: {
      token_hash: tokenHash,
      expires_at: { gt: new Date() },
    },
    include: { users: true },
  });
  if (!stored) throw new ApiError(401, "Invalid or expired refresh token");

  await prisma.refresh_tokens.delete({ where: { id: stored.id } });

  const user: AuthUser = {
    id: stored.users.id,
    email: stored.users.email,
    name: stored.users.name,
    role: stored.users.role,
  };
  return createTokenPair(user);
}

export async function logoutUser(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refresh_tokens.deleteMany({ where: { token_hash: tokenHash } });
}

export async function getUserById(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      webhook_id: true,
      notify_email: true,
      created_at: true,
    },
  });
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

export async function updateUser(
  userId: string,
  data: { name?: string; notify_email?: boolean; email?: string },
) {
  return prisma.users.update({
    where: { id: userId },
    data: { ...data, updated_at: new Date() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      webhook_id: true,
      notify_email: true,
    },
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new ApiError(400, "Current password is incorrect");

  const password_hash = await bcrypt.hash(newPassword, 12);
  await prisma.users.update({
    where: { id: userId },
    data: { password_hash, updated_at: new Date() },
  });

  // Invalidate all refresh tokens on password change
  await prisma.refresh_tokens.deleteMany({ where: { user_id: userId } });
}

export function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
}
