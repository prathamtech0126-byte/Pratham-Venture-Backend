import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createPromotionLetter,
  listPromotionLetters,
  getPromotionLetter,
  updatePromotionLetter,
  deletePromotionLetter,
} from "../controllers/promotionLetters.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createPromotionLetter);
router.get("/", listPromotionLetters);
router.get("/:id", getPromotionLetter);
router.patch("/:id", updatePromotionLetter);
router.delete("/:id", deletePromotionLetter);

export default router;
