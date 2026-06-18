import { Queue, Worker, Job } from "bullmq";
import { redisClient } from "./redis";
import { logger } from "./logger";
import { runAnalysis } from "../graphs/biGraph";
import { runWebhookAnalysis } from "../graphs/biWebhookGraph";
import { sendWorkflowReport } from "../workflow/reportDelivery";
import { prisma } from "./prisma";

const connection = { host: "localhost", port: 6379 };

// ── Queues ────────────────────────────────────────────────
export const analysisQueue = new Queue("analysis", { connection });
export const workflowQueue = new Queue("workflow", { connection });

async function processAnalysisJob(job: Job) {
  const { analysisId, question, dataSourceId } = job.data as {
    analysisId: string;
    question: string;
    dataSourceId?: string;
  };

  logger.info({ analysisId, question, jobName: job.name }, "Processing analysis job");

  await prisma.analyses.update({
    where: { id: analysisId },
    data: { status: "running", started_at: new Date() },
  });

  const result =
    job.name === "run-webhook-analysis"
      ? await runWebhookAnalysis(question, analysisId, dataSourceId)
      : await runAnalysis(question, analysisId);

  if (result.error) {
    await prisma.analyses.update({
      where: { id: analysisId },
      data: { status: "failed", error: result.error, finished_at: new Date() },
    });
    throw new Error(result.error);
  }

  return result;
}

// ── Analysis Worker ───────────────────────────────────────
export const analysisWorker = new Worker("analysis", processAnalysisJob, {
  connection,
  concurrency: 3,
});

// ── Workflow Worker ───────────────────────────────────────
export const workflowWorker = new Worker(
  "workflow",
  async (job: Job) => {
    const { workflowId, runId } = job.data as { workflowId: string; runId: string };
    logger.info({ workflowId, runId }, "Processing workflow job");

    await prisma.workflow_runs.update({
      where: { id: runId },
      data: { status: "running" },
    });

    try {
      const workflow = await prisma.workflows.findUniqueOrThrow({ where: { id: workflowId } });

      // Create analysis from workflow question embedded in steps
      const steps = workflow.steps as Array<{ task: string }>;
      const question = steps.map((s) => s.task).join(", ");

      const analysis = await prisma.analyses.create({
        data: {
          question,
          status: "pending",
          created_by: workflow.created_by as string,
        },
      });

      const result = await runAnalysis(question, analysis.id);

      // Save step results
      let order = 1;
      for (const trace of result.agent_trace) {
        await prisma.step_results.create({
          data: {
            run_id: runId,
            step_order: order++,
            agent: trace.agent as any,
            input: {},
            output: trace.output as object,
            status: trace.status,
          },
        });
      }

      await prisma.workflow_runs.update({
        where: { id: runId },
        data: {
          status: result.error ? "failed" : "success",
          finished_at: new Date(),
          result: { analysis_id: analysis.id, report: result.report } as object,
          error: result.error ?? null,
        },
      });

      // Deliver report to admin users
      if (!result.error) {
        await sendWorkflowReport(workflow, result);
      }

      await prisma.workflows.update({
        where: { id: workflowId },
        data: { last_run: new Date() },
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.workflow_runs.update({
        where: { id: runId },
        data: { status: "failed", finished_at: new Date(), error: message },
      });
      throw err;
    }
  },
  { connection, concurrency: 2 }
);

// Log worker events
analysisWorker.on("completed", (job) => logger.info({ jobId: job.id }, "Analysis job completed"));
analysisWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "Analysis job failed"));
workflowWorker.on("completed", (job) => logger.info({ jobId: job.id }, "Workflow job completed"));
workflowWorker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "Workflow job failed"));