import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../schemas/employee.schema";
import { parseId } from "../utils/parseId";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

function normalizeOptionalEmail(email: string | null | undefined): string | null | undefined {
  if (email === undefined) return undefined;
  if (email === null || email === "") return null;
  return email;
}

// POST /api/employees
export async function createEmployee(req: Request, res: Response) {
  const parsed = createEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const data = {
    ...parsed.data,
    email: normalizeOptionalEmail(parsed.data.email) ?? null,
  };

  const employee = await prisma.employee.create({ data });
  return res.status(201).json(withStatus(employee));
}

/**
 * GET /api/employees?company=...&page&limit&search&status=active|inactive|all
 * `company` filters employees for Offer Letter / Salary Slip dropdowns.
 */
export async function listEmployees(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const company = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.EmployeeWhereInput = { ...softDeleteWhere(status) };
  if (company) {
    where.company = { equals: company, mode: "insensitive" };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { employeeCode: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { designation: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    data: rows.map(withStatus),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

/**
 * GET /api/employees/by-company?company=Pratham Venture
 * Lightweight list for offer-letter / salary-slip selectors (active only).
 */
export async function listEmployeesByCompany(req: Request, res: Response) {
  const company = typeof req.query.company === "string" ? req.query.company.trim() : "";
  if (!company) {
    return res.status(400).json({ error: "Query param company is required" });
  }

  const rows = await prisma.employee.findMany({
    where: {
      deletedAt: null,
      company: { equals: company, mode: "insensitive" },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      company: true,
      name: true,
      employeeCode: true,
      email: true,
      phone: true,
      designation: true,
      department: true,
      workLocation: true,
      joiningDate: true,
      annualCtc: true,
      uan: true,
      pfNumber: true,
      esiNumber: true,
      bankName: true,
      bankAccountNo: true,
    },
  });

  return res.json({ data: rows });
}

/**
 * GET /api/employees/:id/overview
 * View Client page: employee + linked salary slips + offer letters.
 */
export async function getEmployeeOverview(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, ...softDeleteWhere(status) },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const docStatus = parseSoftDeleteStatus(req, "docStatus");
  if (!docStatus) {
    return res.status(400).json({ error: "Invalid docStatus. Use active, inactive, or all." });
  }

  const slipWhere: Prisma.SalarySlipWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(docStatus),
  };
  const letterWhere: Prisma.OfferLetterWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(docStatus),
  };
  const nocWhere: Prisma.NocCertificateWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(docStatus),
  };
  const evlWhere: Prisma.EmploymentVerificationLetterWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(docStatus),
  };
  const jdcWhere: Prisma.JobDutyCertificateWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(docStatus),
  };
  const apptWhere: Prisma.AppointmentLetterWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(docStatus),
  };
  const promoWhere: Prisma.PromotionLetterWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(docStatus),
  };

  const [
    salaryTotal,
    salaryRows,
    letterTotal,
    letterRows,
    nocTotal,
    nocRows,
    evlTotal,
    evlRows,
    jdcTotal,
    jdcRows,
    apptTotal,
    apptRows,
    promoTotal,
    promoRows,
  ] = await Promise.all([
    prisma.salarySlip.count({ where: slipWhere }),
    prisma.salarySlip.findMany({
      where: slipWhere,
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    }),
    prisma.offerLetter.count({ where: letterWhere }),
    prisma.offerLetter.findMany({
      where: letterWhere,
      orderBy: { createdAt: "desc" },
    }),
    prisma.nocCertificate.count({ where: nocWhere }),
    prisma.nocCertificate.findMany({
      where: nocWhere,
      orderBy: [{ certificateDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.employmentVerificationLetter.count({ where: evlWhere }),
    prisma.employmentVerificationLetter.findMany({
      where: evlWhere,
      orderBy: [{ letterDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.jobDutyCertificate.count({ where: jdcWhere }),
    prisma.jobDutyCertificate.findMany({
      where: jdcWhere,
      orderBy: [{ certificateDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.appointmentLetter.count({ where: apptWhere }),
    prisma.appointmentLetter.findMany({
      where: apptWhere,
      orderBy: [{ letterDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.promotionLetter.count({ where: promoWhere }),
    prisma.promotionLetter.findMany({
      where: promoWhere,
      orderBy: [{ letterDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return res.json({
    employee: withStatus(employee),
    salarySlips: {
      total: salaryTotal,
      data: salaryRows.map(withStatus),
    },
    offerLetters: {
      total: letterTotal,
      data: letterRows.map(withStatus),
    },
    nocCertificates: {
      total: nocTotal,
      data: nocRows.map(withStatus),
    },
    employmentVerificationLetters: {
      total: evlTotal,
      data: evlRows.map(withStatus),
    },
    jobDutyCertificates: {
      total: jdcTotal,
      data: jdcRows.map(withStatus),
    },
    appointmentLetters: {
      total: apptTotal,
      data: apptRows.map(withStatus),
    },
    promotionLetters: {
      total: promoTotal,
      data: promoRows.map(withStatus),
    },
  });
}

// GET /api/employees/:id/salary-slips?page&limit&status=
export async function listEmployeeSalarySlips(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.SalarySlipWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(status),
  };

  const [total, rows] = await Promise.all([
    prisma.salarySlip.count({ where }),
    prisma.salarySlip.findMany({
      where,
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    data: rows.map(withStatus),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/employees/:id/offer-letters?page&limit&status=
export async function listEmployeeOfferLetters(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.OfferLetterWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(status),
  };

  const [total, rows] = await Promise.all([
    prisma.offerLetter.count({ where }),
    prisma.offerLetter.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    data: rows.map(withStatus),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/employees/:id/noc-certificates?page&limit&status=
export async function listEmployeeNocCertificates(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.NocCertificateWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(status),
  };

  const [total, rows] = await Promise.all([
    prisma.nocCertificate.count({ where }),
    prisma.nocCertificate.findMany({
      where,
      orderBy: [{ certificateDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    data: rows.map(withStatus),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/employees/:id/employment-verification-letters?page&limit&status=
export async function listEmployeeEmploymentVerificationLetters(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.EmploymentVerificationLetterWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(status),
  };

  const [total, rows] = await Promise.all([
    prisma.employmentVerificationLetter.count({ where }),
    prisma.employmentVerificationLetter.findMany({
      where,
      orderBy: [{ letterDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    data: rows.map(withStatus),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/employees/:id/job-duty-certificates?page&limit&status=
export async function listEmployeeJobDutyCertificates(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.JobDutyCertificateWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(status),
  };

  const [total, rows] = await Promise.all([
    prisma.jobDutyCertificate.count({ where }),
    prisma.jobDutyCertificate.findMany({
      where,
      orderBy: [{ certificateDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    data: rows.map(withStatus),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/employees/:id/appointment-letters?page&limit&status=
export async function listEmployeeAppointmentLetters(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.AppointmentLetterWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(status),
  };

  const [total, rows] = await Promise.all([
    prisma.appointmentLetter.count({ where }),
    prisma.appointmentLetter.findMany({
      where,
      orderBy: [{ letterDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    data: rows.map(withStatus),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/employees/:id/promotion-letters?page&limit&status=
export async function listEmployeePromotionLetters(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.PromotionLetterWhereInput = {
    employeeRefId: id,
    ...softDeleteWhere(status),
  };

  const [total, rows] = await Promise.all([
    prisma.promotionLetter.count({ where }),
    prisma.promotionLetter.findMany({
      where,
      orderBy: [{ letterDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    data: rows.map(withStatus),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/employees/:id
export async function getEmployee(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, ...softDeleteWhere(status) },
  });
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  return res.json(withStatus(employee));
}

// PATCH /api/employees/:id
export async function updateEmployee(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, email, ...rest } = parsed.data;
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Employee not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'Employee not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...rest,
      ...(email !== undefined ? { email: normalizeOptionalEmail(email) ?? null } : {}),
      ...(restore ? { deletedAt: null } : {}),
    },
  });

  return res.json(withStatus(employee));
}

// DELETE /api/employees/:id  (soft delete)
export async function deleteEmployee(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Employee not found" });
  }

  await prisma.employee.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}
