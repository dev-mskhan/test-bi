import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/authService";
import { ApiError } from "../utils/ApiError";

export function authHandler(req: Request, _res: Response, next: NextFunction) {
  const token = req.signedCookies?.accessToken;

  if (!token) throw new ApiError(401, "Not authenticated");

  const payload = verifyAccessToken(token);
  (req as any).user = payload;
  next();
}
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.signedCookies?.accessToken;

  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    (req as any).user = payload;
  } catch {
    // expired or invalid — let the route handle it via refresh cookie
  }
  next();
}