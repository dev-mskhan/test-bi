import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      throw new ApiError(403, `Requires role: ${roles.join(" or ")}`);
    }
    next();
  };
}