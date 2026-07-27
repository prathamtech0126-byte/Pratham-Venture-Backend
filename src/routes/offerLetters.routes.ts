import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createOfferLetter,
  listOfferLetters,
  getOfferLetter,
  updateOfferLetter,
  deleteOfferLetter,
} from "../controllers/offerLetters.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createOfferLetter);
router.get("/", listOfferLetters);
router.get("/:id", getOfferLetter);
router.patch("/:id", updateOfferLetter);
router.delete("/:id", deleteOfferLetter);

export default router;
