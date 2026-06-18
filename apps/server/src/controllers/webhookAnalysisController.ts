import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../services/prisma";
import { analysisQueue } from "../services/queue";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../services/logger";

// POST /api/analysis/webhook
export const createWebhookAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const { question, data_source_id } = req.body;
  const dataSourceId = data_source_id || undefined;
  const userId = (req as any).user.id;

  if (data_source_id) {
    const source = await prisma.data_sources.findFirst({
      where: { id: data_source_id, type: "api", is_active: true },
    });
    if (!source) throw new ApiError(400, "Invalid or inactive webhook data source");
  }

  const analysis = await prisma.analyses.create({
    data: {
      id: uuidv4(),
      question,
      created_by: userId,
      status: "pending",
    },
  });

  await analysisQueue.add(
    "run-webhook-analysis",
    { analysisId: analysis.id, question, dataSourceId },
    { jobId: `webhook-${analysis.id}`, attempts: 2, backoff: { type: "exponential", delay: 3000 } }
  );

  logger.info({ analysisId: analysis.id, userId, data_source_id: dataSourceId }, "Webhook analysis queued");

  res.status(202).json(
    new ApiResponse(
      202,
      { analysis_id: analysis.id, status: "pending", source: "webhook", data_source_id: dataSourceId },
      "Webhook analysis queued"
    )
  );
});

// GET /api/analysis/webhook/sources
export const listWebhookDataSources = asyncHandler(async (_req: Request, res: Response) => {
  const sources = await prisma.data_sources.findMany({
    where: { type: "api", is_active: true },
    select: {
      id: true,
      name: true,
      type: true,
      connection_config: true,
      last_synced: true,
    },
    orderBy: { name: "asc" },
  });

  res.json(new ApiResponse(200, sources, "Webhook data sources listed"));
});
