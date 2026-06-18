import cron, { ScheduledTask } from "node-cron";
import { prisma } from "../services/prisma";
import { workflowQueue } from "../services/queue";
import { logger } from "../services/logger";
import { v4 as uuidv4 } from "uuid";

interface TriggerConfig {
  cron: string;
  timezone?: string;
}

const activeSchedules = new Map<string, ScheduledTask>();

export async function bootScheduler(): Promise<void> {
  logger.info("Booting workflow scheduler");

  const workflows = await prisma.workflows.findMany({
    where: { is_active: true, trigger_type: "schedule" },
  });

  for (const wf of workflows) {
    scheduleWorkflow(wf.id, (wf.trigger_config as unknown as TriggerConfig).cron);
  }

  logger.info({ count: workflows.length }, "Scheduler booted");
}

export function scheduleWorkflow(workflowId: string, cronExpression: string): void {
  // Remove old schedule if re-scheduling
  activeSchedules.get(workflowId)?.destroy();

  const task = cron.schedule(cronExpression, async () => {
    logger.info({ workflowId, cron: cronExpression }, "Cron fired — queuing workflow run");
    await enqueueWorkflowRun(workflowId, "schedule");
  });

  activeSchedules.set(workflowId, task);
  logger.info({ workflowId, cronExpression }, "Workflow scheduled");
}

export function unscheduleWorkflow(workflowId: string): void {
  activeSchedules.get(workflowId)?.destroy();
  activeSchedules.delete(workflowId);
}

export async function enqueueWorkflowRun(
  workflowId: string,
  triggeredBy: "schedule" | "manual" | "event"
): Promise<string> {
  const runId = uuidv4();

  await prisma.workflow_runs.create({
    data: {
      id: runId,
      workflow_id: workflowId,
      status: "running",
      triggered_by: triggeredBy,
    },
  });

  await workflowQueue.add("run-workflow", { workflowId, runId });

  return runId;
}