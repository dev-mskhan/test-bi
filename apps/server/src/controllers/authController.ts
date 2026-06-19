import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import crypto from "crypto";
import { emitUserCreatedWebhook } from "../services/emitter";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  signed: true,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;
  const { user, tokens } = await authService.registerUser(
    email,
    password,
    name,
    role,
  );

  res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTS);
  res.cookie("accessToken", tokens.accessToken, COOKIE_OPTS);
  void emitUserCreatedWebhook({
    webhookId: user.webhook_id!,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { user }, "Registered successfully"));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { user, tokens } = await authService.loginUser(email, password);

  res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTS);
  res.cookie("accessToken", tokens.accessToken, COOKIE_OPTS);

  return res.json(new ApiResponse(200, { user }, "Login successful"));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.signedCookies?.refreshToken;
  if (token) await authService.logoutUser(token);

  res.clearCookie("refreshToken", { path: "/" });
  res.clearCookie("accessToken", { path: "/" });

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
  const user = await authService.updateUser((req as any).user.id, {
    name,
    notify_email,
    email,
  });
  return res.json(new ApiResponse(200, user, "Profile updated"));
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { current_password, new_password } = req.body;
    const userId = (req as any).user.id;

    await authService.changePassword(userId, current_password, new_password);

    return res.json(new ApiResponse(200, null, "Password changed"));
  },
);

export const getWebhookVerificationUrl = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const user = await authService.getUserById(userId);

    if (!user.webhook_id) {
      throw new ApiError(400, "User does not have a webhook configured");
    }

    const webhookServerUrl =
      process.env.WEBHOOK_SERVER_URL || "http://localhost:5001";
    const verificationUrl = `${webhookServerUrl}/webhook/${user.webhook_id}`;

    return res.json(
      new ApiResponse(
        200,
        { webhook_id: user.webhook_id, verification_url: verificationUrl },
        "Webhook verification URL retrieved",
      ),
    );
  },
);
