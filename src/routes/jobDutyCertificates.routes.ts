import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createJobDutyCertificate,
  listJobDutyCertificates,
  getJobDutyCertificate,
  updateJobDutyCertificate,
  deleteJobDutyCertificate,
} from "../controllers/jobDutyCertificates.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createJobDutyCertificate);
router.get("/", listJobDutyCertificates);
router.get("/:id", getJobDutyCertificate);
router.patch("/:id", updateJobDutyCertificate);
router.delete("/:id", deleteJobDutyCertificate);

export default router;
