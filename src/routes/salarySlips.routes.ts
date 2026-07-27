import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createSalarySlip,
  listSalarySlips,
  getSalarySlip,
  updateSalarySlip,
  deleteSalarySlip,
} from "../controllers/salarySlips.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createSalarySlip);
router.get("/", listSalarySlips);
router.get("/:id", getSalarySlip);
router.patch("/:id", updateSalarySlip);
router.delete("/:id", deleteSalarySlip);

export default router;
