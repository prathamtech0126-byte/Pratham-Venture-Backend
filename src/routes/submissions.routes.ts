import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import {
  listSubmissions,
  getSubmission,
  updateSubmissionStatus,
  deleteSubmission,
} from "../controllers/submissions.controller";

const router = Router();

// Contact-form submissions: Admin + Super Admin only — HR is blocked completely.
router.use(requireAuth, requireRole(Role.ADMIN, Role.SUPER_ADMIN));

router.get("/", listSubmissions);
router.get("/:id", getSubmission);
router.patch("/:id", updateSubmissionStatus);
router.delete("/:id", deleteSubmission);

export default router;
