import { Router } from "express";
import { listUsers, updateUser, platformStats } from "../controllers/adminController";
import { authHandler } from "../middleware/authHandler";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(authHandler);
router.use(requireRole("admin")); // all admin routes locked to admin role

router.get("/users",        listUsers);
router.patch("/users/:id",  updateUser);
router.get("/stats",        platformStats);

export default router;