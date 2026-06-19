import { Router } from "express";
import {
  handleUserCreated,
  handleGetWebhookUser,
} from "../controllers/webhookUser.controller";

const router = Router();

// POST /webhooks/user-created
router.post("/user-created", handleUserCreated);

// GET /webhooks/:webhookId
router.get("/:webhookId", handleGetWebhookUser);

export default router;
