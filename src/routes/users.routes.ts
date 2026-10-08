import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { listUsers, createUser, updateUser, deleteUser } from "../controllers/users.controller";

const router = Router();

// User management is Super Admin only.
router.use(requireAuth, requireRole(Role.SUPER_ADMIN));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
