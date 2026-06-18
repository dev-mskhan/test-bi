import { Request, Response } from "express";
import { prisma } from "../services/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// GET /api/admin/users
export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.users.findMany({
    select: {
      id: true, email: true, name: true, role: true,
      is_active: true, notify_email: true, created_at: true,
    },
    orderBy: { created_at: "desc" },
  });
  res.json(new ApiResponse(200, users, "Users listed"));
});

// PATCH /api/admin/users/:id
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, role, is_active, notify_email } = req.body;

  const user = await prisma.users.update({
    where: { id: req.params.id as string },
    data: { email, role, is_active, notify_email, updated_at: new Date() },
    select: { id: true, email: true, name: true, role: true, is_active: true },
  });

  res.json(new ApiResponse(200, user, "User updated"));
});

// GET /api/admin/stats
export const platformStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalAnalyses, totalWorkflows, recentRuns] = await prisma.$transaction([
    prisma.users.count(),
    prisma.analyses.count(),
    prisma.workflows.count(),
    prisma.workflow_runs.count({
      where: { started_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const analysesByStatus = await prisma.analyses.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  res.json(
    new ApiResponse(
      200,
      { totalUsers, totalAnalyses, totalWorkflows, recentRuns, analysesByStatus },
      "Stats fetched"
    )
  );
});