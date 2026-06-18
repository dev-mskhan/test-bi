import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../services/prisma";
import { analysisQueue } from "../services/queue";
import { similaritySearch } from "../services/embeddings";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../services/logger";

// POST /api/analysis
// User sends a plain-English question → queued → agents run
export const createAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const { question } = req.body;
  const userId = (req as any).user.id;

  const analysis = await prisma.analyses.create({
    data: {
      id: uuidv4(),
      question,
      created_by: userId,
      status: "pending",
    },
  });

  // Push to BullMQ — workers pick this up and run the 5-agent graph
  await analysisQueue.add(
    "run-analysis",
    { analysisId: analysis.id, question },
    { jobId: analysis.id, attempts: 2, backoff: { type: "exponential", delay: 3000 } }
  );

  logger.info({ analysisId: analysis.id, userId }, "Analysis queued");

  res.status(202).json(
    new ApiResponse(202, { analysis_id: analysis.id, status: "pending" }, "Analysis queued")
  );
});

// GET /api/analysis/:id
// Poll for result — frontend polls until status = 'done'
export const getAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const analysis = await prisma.analyses.findUnique({
    where: { id },
    select: {
      id: true,
      question: true,
      status: true,
      plan: true,
      raw_data: true,
      findings: true,
      charts: true,
      report: true,
      error: true,
      started_at: true,
      finished_at: true,
      created_at: true,
    },
  });

  if (!analysis) throw new ApiError(404, "Analysis not found");

  res.json(new ApiResponse(200, analysis, "Analysis fetched"));
});

// GET /api/analysis
// List all analyses for current user
export const listAnalyses = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);

  const [analyses, total] = await prisma.$transaction([
    prisma.analyses.findMany({
      where: { created_by: userId },
    select: {
      id: true,
      question: true,
      status: true,
      plan: true,
      error: true,
      started_at: true,
      finished_at: true,
      created_at: true,
    },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.analyses.count({ where: { created_by: userId } }),
  ]);

  res.json(new ApiResponse(200, { analyses, total, page, limit }, "Analyses listed"));
});

// GET /api/analysis/:id/status
// Lightweight status check for polling
export const getAnalysisStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const analysis = await prisma.analyses.findUnique({
    where: { id },
    select: { id: true, status: true, error: true, started_at: true, finished_at: true },
  });

  if (!analysis) throw new ApiError(404, "Analysis not found");

  res.json(new ApiResponse(200, analysis, "Status fetched"));
});

// POST /api/analysis/search
// Semantic search over past analyses using vector embeddings
export const searchAnalyses = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) throw new ApiError(400, "query is required");

  const ids = await similaritySearch(query, 5);

  const analyses = await prisma.analyses.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      question: true,
      status: true,
      created_at: true,
    },
  });

  res.json(new ApiResponse(200, analyses, "Semantic search results"));
});

// DELETE /api/analysis/:id
export const deleteAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = (req as any).user.id;

  const analysis = await prisma.analyses.findUnique({ where: { id } });
  if (!analysis) throw new ApiError(404, "Analysis not found");

  const user = (req as any).user;
  if (analysis.created_by !== userId && user.role !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  await prisma.analyses.delete({ where: { id } });
  res.json(new ApiResponse(200, null, "Analysis deleted"));
});