import { Router } from "express";
import { Workspace } from "@prisma/client";
import { requireAuth, requireWorkspace } from "../middleware/auth.middleware";
import {
  createEngagementLetter,
  listEngagementLetters,
  getEngagementLetter,
  updateEngagementLetter,
  deleteEngagementLetter,
} from "../controllers/engagementLetters.controller";

const router = Router();

// Engagement letters are an HR (Pratham International) document only.
router.use(requireAuth, requireWorkspace(Workspace.HR));

router.post("/", createEngagementLetter);
router.get("/", listEngagementLetters);
router.get("/:id", getEngagementLetter);
router.patch("/:id", updateEngagementLetter);
router.delete("/:id", deleteEngagementLetter);

export default router;
