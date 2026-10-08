import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createDesignation,
  listDesignations,
  listDesignationsByCompany,
  getDesignationJobDescription,
  getDesignation,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designations.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createDesignation);
router.get("/", listDesignations);
router.get("/by-company", listDesignationsByCompany);
router.get("/job-description", getDesignationJobDescription);
router.get("/:id", getDesignation);
router.patch("/:id", updateDesignation);
router.delete("/:id", deleteDesignation);

export default router;
