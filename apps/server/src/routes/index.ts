import { Router } from "express";
import authRoutes             from "./authRoutes";
import analysisRoutes         from "./analysisRoutes";
import webhookAnalysisRoutes  from "./webhookAnalysisRoutes";
import workflowRoutes         from "./workflowRoutes";
import adminRoutes            from "./adminRoutes";

const router = Router();

router.use("/auth",              authRoutes);
router.use("/analysis/webhook",  webhookAnalysisRoutes);
router.use("/analysis",          analysisRoutes);
router.use("/workflows",         workflowRoutes);
router.use("/admin",             adminRoutes);

export default router;