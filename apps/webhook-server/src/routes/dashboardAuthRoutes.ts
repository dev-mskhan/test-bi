import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as svc from '../dashboardAuthService';

export const authRouter = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  signed:   true,
  path:     '/',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

// ── Auth middleware for dashboard API routes ───────────────────────────────
// Defined first so it's clearly available to routes below (also works via
// hoisting either way, since this is a function declaration).
export function dashboardAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  try {
    const payload = svc.verifyDashboardToken(header.split(' ')[1]);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

authRouter.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('webhookName').trim().notEmpty(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { user, tokens, endpoint } = await svc.dashboardRegister(
        req.body.email, req.body.password, req.body.name, req.body.webhookName
      );
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS);
      return res.status(201).json({ user, accessToken: tokens.accessToken, endpoint });
    } catch (err) { next(err); }
  }
);

authRouter.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { user, tokens, endpoint } = await svc.dashboardLogin(
        req.body.email, req.body.password
      );
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS);
      return res.json({ user, accessToken: tokens.accessToken, endpoint });
    } catch (err) { next(err); }
  }
);

authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.signedCookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });
    const { user, tokens, endpoint } = await svc.dashboardRefresh(token);
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS);
    return res.json({ user, accessToken: tokens.accessToken, endpoint });
  } catch (err) { next(err); }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  const token = req.signedCookies?.refreshToken;
  if (token) await svc.dashboardLogout(token);
  res.clearCookie('refreshToken', { path: '/' });
  return res.json({ message: 'Logged out' });
});

authRouter.get('/me', dashboardAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, endpoint } = await svc.getDashboardUser((req as any).user.sub);
    return res.json({ user, endpoint });
  } catch (err) { next(err); }
});