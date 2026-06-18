import { Router } from "express";
import {
  createAnalysis, getAnalysis, listAnalyses,
  getAnalysisStatus, searchAnalyses, deleteAnalysis,
} from "../controllers/analysisController";
import { authHandler } from "../middleware/authHandler";
import { validateRequest } from "../middleware/validateRequest";
import { z } from "zod";

const router = Router();

const createSchema = z.object({
  body: z.object({
    question: z.string().min(5, "Question too short").max(1000),
  }),
});

const searchSchema = z.object({
  body: z.object({
    query: z.string().min(3),
  }),
});

router.use(authHandler); // all analysis routes require auth

router.post("/",         validateRequest(createSchema),  createAnalysis);
router.post("/search",   validateRequest(searchSchema),  searchAnalyses);
router.get("/",                                          listAnalyses);
router.get("/:id",                                       getAnalysis);
router.get("/:id/status",                                getAnalysisStatus);
router.delete("/:id",                                    deleteAnalysis);

export default router;