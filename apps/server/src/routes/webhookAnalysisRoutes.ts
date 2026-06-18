import { Router } from "express";
import {
  createWebhookAnalysis,
  listWebhookDataSources,
} from "../controllers/webhookAnalysisController";
import { authHandler } from "../middleware/authHandler";
import { validateRequest } from "../middleware/validateRequest";
import { z } from "zod";

const router = Router();

const createSchema = z.object({
  body: z.object({
    question: z.string().min(5, "Question too short").max(1000),
    data_source_id: z.union([z.string().uuid(), z.literal(""), z.literal(null)]).optional(),
  }),
});

router.use(authHandler);

router.get("/sources", listWebhookDataSources);
router.post("/", validateRequest(createSchema), createWebhookAnalysis);

export default router;
