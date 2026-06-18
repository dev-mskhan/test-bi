import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../services/prisma";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { scheduleWorkflow, unscheduleWorkflow, enqueueWorkflowRun } from "../workflow/scheduler";
import { logger } from "../services/logger";

// POST /api/workflows
export const createWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const {
    name, description, trigger_type, trigger_config,
    steps, output_type, output_config,
  } = req.body;

  const workflow = await prisma.workflows.create({
    data: {
      id: uuidv4(),
      name,
      description,
      created_by: userId,
      trigger_type,
      trigger_config,
      steps,
      output_type: output_type ?? "email",
      output_config: output_config ?? {},
      is_active: true,
    },
  });

  // Register cron if schedule-based
  if (trigger_type === "schedule" && trigger_config?.cron) {
    scheduleWorkflow(workflow.id, trigger_config.cron);
  }

  logger.info({ workflowId: workflow.id }, "Workflow created");
  res.status(201).json(new ApiResponse(201, workflow, "Workflow created"));
});

// GET /api/workflows
export const listWorkflows = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const user = (req as any).user;

  const where = user.role === "admin" ? {} : { created_by: userId };

  const workflows = await prisma.workflows.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      _count: { select: { workflow_runs: true } },
    },
  });

  res.json(new ApiResponse(200, workflows, "Workflows listed"));
});

// GET /api/workflows/:id
export const getWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const workflow = await prisma.workflows.findUnique({
    where: { id: req.params.id as string },
    include: {
      workflow_runs: {
        orderBy: { started_at: "desc" },
        take: 10,
        select: {
          id: true, status: true, started_at: true, finished_at: true, error: true,
        },
      },
    },
  });

  if (!workflow) throw new ApiError(404, "Workflow not found");
  res.json(new ApiResponse(200, workflow, "Workflow fetched"));
});

// PATCH /api/workflows/:id
export const updateWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, description, trigger_config, steps, output_config, is_active } = req.body;

  const existing = await prisma.workflows.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Workflow not found");

  const workflow = await prisma.workflows.update({
    where: { id },
    data: { name, description, trigger_config, steps, output_config, is_active, updated_at: new Date() },
  });

  // Re-schedule if cron changed
  if (trigger_config?.cron) {
    if (is_active) {
      scheduleWorkflow(id as string, trigger_config.cron);
    } else {
      unscheduleWorkflow(id as string);
    }
  }

  res.json(new ApiResponse(200, workflow, "Workflow updated"));
});

// DELETE /api/workflows/:id
export const deleteWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.workflows.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Workflow not found");

  unscheduleWorkflow(id as string);
  await prisma.workflows.delete({ where: { id } });

  res.json(new ApiResponse(200, null, "Workflow deleted"));
});

// POST /api/workflows/:id/run
// Manually trigger a workflow run
export const triggerWorkflow = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const workflow = await prisma.workflows.findUnique({ where: { id } });
  if (!workflow) throw new ApiError(404, "Workflow not found");
  if (!workflow.is_active) throw new ApiError(400, "Workflow is inactive");

  const runId = await enqueueWorkflowRun(id as string, "manual");

  logger.info({ workflowId: id, runId }, "Workflow manually triggered");
  res.status(202).json(new ApiResponse(202, { run_id: runId }, "Workflow triggered"));
});

// GET /api/workflows/:id/runs
export const getWorkflowRuns = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);

  const [runs, total] = await prisma.$transaction([
    prisma.workflow_runs.findMany({
      where: { workflow_id: id },
      orderBy: { started_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        step_results: { orderBy: { step_order: "asc" } },
      },
    }),
    prisma.workflow_runs.count({ where: { workflow_id: id } }),
  ]);

  res.json(new ApiResponse(200, { runs, total, page, limit }, "Runs fetched"));
});

// GET /api/workflows/runs/:runId
export const getRunDetail = asyncHandler(async (req: Request, res: Response) => {
  const run = await prisma.workflow_runs.findUnique({
    where: { id: req.params.runId as string },
    include: {
      step_results: { orderBy: { step_order: "asc" } },
      workflows: { select: { name: true } },
    },
  });

  if (!run) throw new ApiError(404, "Run not found");
  res.json(new ApiResponse(200, run, "Run detail fetched"));
});