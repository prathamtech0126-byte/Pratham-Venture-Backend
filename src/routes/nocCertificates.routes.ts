import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createNocCertificate,
  listNocCertificates,
  getNocCertificate,
  updateNocCertificate,
  deleteNocCertificate,
} from "../controllers/nocCertificates.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createNocCertificate);
router.get("/", listNocCertificates);
router.get("/:id", getNocCertificate);
router.patch("/:id", updateNocCertificate);
router.delete("/:id", deleteNocCertificate);

export default router;
