import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { emitUserEvent } from "../services/emitter";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge:   7 * 24 * 60 * 60 * 1000,
  signed:   true,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  const { user, tokens } = await authService.registerUser(email, password, name, role);

  res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTS);
  res.cookie("accessToken", tokens.accessToken, COOKIE_OPTS);
  emitUserEvent("user.registered", {
    userId: user.id,
    email:  user.email,
    name:   user.name,
  });

  return res.status(201).json(new ApiResponse(201, { user }, "Registered successfully"));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { user, tokens } = await authService.loginUser(email, password);

  res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTS);
  res.cookie("accessToken", tokens.accessToken, COOKIE_OPTS);
  emitUserEvent("user.login", {
    userId:    user.id,
    email:     user.email,
    ip:        req.ip,
    userAgent: req.headers["user-agent"],
  });

  return res.json(new ApiResponse(200, { user }, "Login successful"));
});


export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.signedCookies?.refreshToken;
  if (token) await authService.logoutUser(token);

  res.clearCookie("refreshToken", { path: "/" });
  res.clearCookie("accessToken", { path: "/" });
  if ((req as any).user) {
    emitUserEvent("user.logout", {
      userId: (req as any).user.id,
      email:  (req as any).user.email,
    });
  }

  return res.json(new ApiResponse(200, null, "Logged out"));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if ((req as any).user) {
    const user = await authService.getUserById((req as any).user.id);
    return res.json(new ApiResponse(200, user, "Profile fetched"));
  }

  const refreshToken = req.signedCookies?.refreshToken;
  if (!refreshToken) throw new ApiError(401, "Not authenticated");

  const tokens = await authService.refreshTokens(refreshToken);
  res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTS);
  res.cookie("accessToken", tokens.accessToken, COOKIE_OPTS);
  const payload = authService.verifyAccessToken(tokens.accessToken);
  const user = await authService.getUserById(payload.id);

  return res.json(new ApiResponse(200, user, "Profile fetched"));
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, notify_email, email } = req.body;
  const user = await authService.updateUser((req as any).user.id, { name, notify_email, email });
  return res.json(new ApiResponse(200, user, "Profile updated"));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { current_password, new_password } = req.body;
  const userId = (req as any).user.id;

  await authService.changePassword(userId, current_password, new_password);

  emitUserEvent("user.password_changed", {
    userId,
    email: (req as any).user.email,
  });

  return res.json(new ApiResponse(200, null, "Password changed"));
});