import { Router } from "express";
import {
  handleUserCreated,
  handleGetWebhookUser,
  handleVerifyWebhook,
} from "../controllers/webhookUser.controller";

const router = Router();

// POST /webhooks/user-created
router.post("/user-created", handleUserCreated);

// GET /webhooks/:webhookId
router.get("/:webhookId", handleGetWebhookUser);

router.get("/verify/:webhookId", handleVerifyWebhook);
export default router;
