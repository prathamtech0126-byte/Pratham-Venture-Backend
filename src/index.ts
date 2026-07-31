import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import submissionsRoutes from "./routes/submissions.routes";
import offerLettersRoutes from "./routes/offerLetters.routes";
import salarySlipsRoutes from "./routes/salarySlips.routes";
import nocCertificatesRoutes from "./routes/nocCertificates.routes";
import employmentVerificationLettersRoutes from "./routes/employmentVerificationLetters.routes";
import jobDutyCertificatesRoutes from "./routes/jobDutyCertificates.routes";
import appointmentLettersRoutes from "./routes/appointmentLetters.routes";
import employeesRoutes from "./routes/employees.routes";
import companiesRoutes from "./routes/companies.routes";
import designationsRoutes from "./routes/designations.routes";
import searchRoutes from "./routes/search.routes";
import { requireAuth } from "./middleware/auth.middleware";
import { createSubmission, getStats, listSites } from "./controllers/submissions.controller";

const app = express();

const allowedOrigins = [
  "https://admin.inklinedigitalsolution.in",
  "http://admin.inklinedigitalsolution.in",
  "https://inklinedigitalsolutions.in",
  "https://www.inklinedigitalsolutions.in",
  "https://inklinedigitalsolution.in",
  "https://www.inklinedigitalsolution.in",
  "https://prarambhmanufacturing.in",
  "https://www.prarambhmanufacturing.in",
  "https://aarogyapathhub.in",
  "https://www.aarogyapathhub.in",
  "https://dearstrangercafe.in",
  "https://www.dearstrangercafe.in",
];

// Any localhost / 127.0.0.1 port is allowed during development
const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin) || localhostRegex.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(express.json());

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this IP, please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

// Public
app.post("/api/contact", contactLimiter, createSubmission);

// Auth
app.use("/api/auth", loginLimiter, authRoutes);

// Protected
app.use("/api/submissions", submissionsRoutes);
app.use("/api/offer-letters", offerLettersRoutes);
app.use("/api/salary-slips", salarySlipsRoutes);
app.use("/api/noc-certificates", nocCertificatesRoutes);
app.use("/api/employment-verification-letters", employmentVerificationLettersRoutes);
app.use("/api/job-duty-certificates", jobDutyCertificatesRoutes);
app.use("/api/appointment-letters", appointmentLettersRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/designations", designationsRoutes);
app.use("/api/search", searchRoutes);
app.get("/api/stats", requireAuth, getStats);
app.get("/api/sites", requireAuth, listSites);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

const PORT = parseInt(process.env.PORT || "5000", 10);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
