import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  listSubmissions,
  getSubmission,
  updateSubmissionStatus,
  deleteSubmission,
} from "../controllers/submissions.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listSubmissions);
router.get("/:id", getSubmission);
router.patch("/:id", updateSubmissionStatus);
router.delete("/:id", deleteSubmission);

export default router;
