import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createEmploymentVerificationLetter,
  listEmploymentVerificationLetters,
  getEmploymentVerificationLetter,
  updateEmploymentVerificationLetter,
  deleteEmploymentVerificationLetter,
} from "../controllers/employmentVerificationLetters.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createEmploymentVerificationLetter);
router.get("/", listEmploymentVerificationLetters);
router.get("/:id", getEmploymentVerificationLetter);
router.patch("/:id", updateEmploymentVerificationLetter);
router.delete("/:id", deleteEmploymentVerificationLetter);

export default router;
