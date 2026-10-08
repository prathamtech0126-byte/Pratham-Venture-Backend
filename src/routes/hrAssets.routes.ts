import path from "path";
import { Router } from "express";
import { Workspace } from "@prisma/client";
import { requireAuth, requireWorkspace } from "../middleware/auth.middleware";

/** Assets that must never be public (served only to signed-in HR users). */
const ASSETS_DIR = path.resolve(__dirname, "../../assets");

const router = Router();
router.use(requireAuth, requireWorkspace(Workspace.HR));

// GET /api/hr-assets/ceo-signature — Director & CEO signature printed on bond renewals
router.get("/ceo-signature", (_req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.sendFile(path.join(ASSETS_DIR, "signatures", "krushit-patel.png"));
});

export default router;
