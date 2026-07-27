import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companies.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createCompany);
router.get("/", listCompanies);
router.get("/:id", getCompany);
router.patch("/:id", updateCompany);
router.delete("/:id", deleteCompany);

export default router;
