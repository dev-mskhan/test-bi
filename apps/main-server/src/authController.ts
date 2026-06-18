import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as authService from './authService';
import { emitUserEvent } from './emitter';

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password, name } = req.body;
    const { user, tokens } = await authService.registerUser(email, password, name);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS);

    // Fire-and-forget webhook
    emitUserEvent('user.registered', {
      userId: user.id,
      email:  user.email,
      name:   user.name,
    });

    return res.status(201).json({
      user,
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const { user, tokens } = await authService.loginUser(email, password);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS);

    emitUserEvent('user.login', {
      userId: user.id,
      email:  user.email,
      ip:     req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ user, accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const tokens = await authService.refreshTokens(token);
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS);

    return res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await authService.logoutUser(token);

    res.clearCookie('refreshToken');

    if ((req as any).user) {
      emitUserEvent('user.logout', {
        userId: (req as any).user.sub,
        email:  (req as any).user.email,
      });
    }

    return res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const userId = (req as any).user.sub;
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(userId, currentPassword, newPassword);

    emitUserEvent('user.password_changed', {
      userId,
      email: (req as any).user.email,
    });

    return res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.sub;
    const email  = (req as any).user.email;

    await authService.deleteUser(userId);
    res.clearCookie('refreshToken');

    emitUserEvent('user.deleted', { userId, email });

    return res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response) {
  return res.json({ user: (req as any).user });
}