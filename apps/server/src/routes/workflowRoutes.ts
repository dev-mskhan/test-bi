import { Router } from "express";
import {
  createWorkflow, listWorkflows, getWorkflow,
  updateWorkflow, deleteWorkflow, triggerWorkflow,
  getWorkflowRuns, getRunDetail,
} from "../controllers/workflowController";
import { authHandler } from "../middleware/authHandler";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validateRequest";
import { z } from "zod";

const router = Router();

const stepSchema = z.object({
  order: z.number().int().min(1),
  agent: z.enum(["planner", "data_agent", "investigator", "visualizer", "reporter"]),
  task: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
});

const createWorkflowSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200),
    description: z.string().optional(),
    trigger_type: z.enum(["schedule", "event", "manual"]),
    trigger_config: z.object({
      cron: z.string().optional(),
      timezone: z.string().optional(),
      event_type: z.string().optional(),
      threshold: z.number().optional(),
    }),
    steps: z.array(stepSchema).min(1),
    output_type: z.enum(["email", "slack", "dashboard", "pdf", "webhook", "none"]).optional(),
    output_config: z.record(z.string(), z.unknown()).optional(),
  }),
});

router.use(authHandler);

router.post("/",                                       validateRequest(createWorkflowSchema), createWorkflow);
router.get("/",                                        listWorkflows);
router.get("/runs/:runId",                             getRunDetail);
router.get("/:id",                                     getWorkflow);
router.patch("/:id",                                   updateWorkflow);
router.delete("/:id",  requireRole("admin", "analyst"), deleteWorkflow);
router.post("/:id/run", requireRole("admin", "analyst"), triggerWorkflow);
router.get("/:id/runs",                                getWorkflowRuns);

export default router;