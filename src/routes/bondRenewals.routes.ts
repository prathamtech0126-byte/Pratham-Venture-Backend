import { Router } from "express";
import { Workspace } from "@prisma/client";
import { requireAuth, requireWorkspace } from "../middleware/auth.middleware";
import {
  createBondRenewal,
  listBondRenewals,
  getBondRenewal,
  updateBondRenewal,
  deleteBondRenewal,
} from "../controllers/bondRenewals.controller";

const router = Router();

// Bond renewals are an HR (Pratham International) document only.
router.use(requireAuth, requireWorkspace(Workspace.HR));

router.post("/", createBondRenewal);
router.get("/", listBondRenewals);
router.get("/:id", getBondRenewal);
router.patch("/:id", updateBondRenewal);
router.delete("/:id", deleteBondRenewal);

export default router;
