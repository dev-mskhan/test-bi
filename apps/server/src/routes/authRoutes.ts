import { Router } from "express";
import { register, login, logout, me, updateMe, changePassword } from "../controllers/authController";
import { authHandler, optionalAuth } from "../middleware/authHandler";
import { validateRequest } from "../middleware/validateRequest";
import { z } from "zod";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, statusCode: 429, message: "Too many attempts, please try again later" },
});

const registerSchema = z.object({
  body: z.object({
    email:    z.string().email(),
    name:     z.string().min(2).max(100),
    password: z.string().min(8),
    role:     z.enum(["admin", "analyst", "viewer"]).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1),
    new_password:     z.string().min(8),
  }),
});

router.post("/register",        authLimiter, validateRequest(registerSchema),        register);
router.post("/login",           authLimiter, validateRequest(loginSchema),           login);
router.post("/logout",          authHandler,                                          logout);
router.get("/me",               optionalAuth,                                          me);
router.patch("/me",             authHandler,                                          updateMe);
router.patch("/change-password", authHandler, validateRequest(changePasswordSchema), changePassword);

export default router;