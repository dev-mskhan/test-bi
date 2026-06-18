import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err.message);

  const knownErrors: Record<string, number> = {
    'Email already registered':    409,
    'Invalid credentials':          401,
    'Account disabled':             403,
    'Invalid or expired refresh token': 401,
    'Current password is incorrect': 400,
    'User not found':               404,
  };

  const status = knownErrors[err.message] ?? 500;
  return res.status(status).json({ error: err.message || 'Internal server error' });
}