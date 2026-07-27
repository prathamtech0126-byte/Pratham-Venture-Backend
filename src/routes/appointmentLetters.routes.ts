import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createAppointmentLetter,
  listAppointmentLetters,
  getAppointmentLetter,
  updateAppointmentLetter,
  deleteAppointmentLetter,
} from "../controllers/appointmentLetters.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createAppointmentLetter);
router.get("/", listAppointmentLetters);
router.get("/:id", getAppointmentLetter);
router.patch("/:id", updateAppointmentLetter);
router.delete("/:id", deleteAppointmentLetter);

export default router;
