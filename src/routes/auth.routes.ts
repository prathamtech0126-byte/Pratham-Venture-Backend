import { Router } from "express";
import { login, logout } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/logout", requireAuth, logout);

export default router;
