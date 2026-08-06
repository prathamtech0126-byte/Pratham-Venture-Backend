import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createEmployee,
  listEmployees,
  listEmployeesByCompany,
  getEmployeeOverview,
  listEmployeeSalarySlips,
  listEmployeeOfferLetters,
  listEmployeeNocCertificates,
  listEmployeeEmploymentVerificationLetters,
  listEmployeeJobDutyCertificates,
  listEmployeeAppointmentLetters,
  listEmployeePromotionLetters,
  getEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employees.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createEmployee);
router.get("/", listEmployees);
router.get("/by-company", listEmployeesByCompany);
router.get("/:id/overview", getEmployeeOverview);
router.get("/:id/salary-slips", listEmployeeSalarySlips);
router.get("/:id/offer-letters", listEmployeeOfferLetters);
router.get("/:id/noc-certificates", listEmployeeNocCertificates);
router.get("/:id/employment-verification-letters", listEmployeeEmploymentVerificationLetters);
router.get("/:id/job-duty-certificates", listEmployeeJobDutyCertificates);
router.get("/:id/appointment-letters", listEmployeeAppointmentLetters);
router.get("/:id/promotion-letters", listEmployeePromotionLetters);
router.get("/:id", getEmployee);
router.patch("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
