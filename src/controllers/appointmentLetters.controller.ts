import { Request, Response } from "express";
import { Prisma, SalaryPaymentFrequency } from "@prisma/client";
import prisma from "../config/db";
import {
  createAppointmentLetterSchema,
  salaryPaymentFrequencySchema,
  updateAppointmentLetterSchema,
} from "../schemas/appointmentLetter.schema";
import { parseId } from "../utils/parseId";
import { assertActiveEmployeeRef } from "../utils/assertEmployeeRef";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

// POST /api/appointment-letters
export async function createAppointmentLetter(req: Request, res: Response) {
  const parsed = createAppointmentLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const check = await assertActiveEmployeeRef(parsed.data.employeeRefId);
  if (!check.ok) {
    return res.status(404).json({ error: check.error });
  }

  const letter = await prisma.appointmentLetter.create({ data: parsed.data });
  return res.status(201).json(withStatus(letter));
}

// GET /api/appointment-letters?page&limit&search&company&employeeRefId&jobTitle&salaryPaymentFrequency&status=
export async function listAppointmentLetters(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const company = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const jobTitle = typeof req.query.jobTitle === "string" ? req.query.jobTitle.trim() : "";
  const frequencyRaw =
    typeof req.query.salaryPaymentFrequency === "string"
      ? req.query.salaryPaymentFrequency.trim()
      : "";
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  let salaryPaymentFrequency: SalaryPaymentFrequency | undefined;
  if (frequencyRaw) {
    const parsedFrequency = salaryPaymentFrequencySchema.safeParse(frequencyRaw);
    if (!parsedFrequency.success) {
      return res.status(400).json({
        error: "Invalid salaryPaymentFrequency. Use WEEKLY, BIWEEKLY, MONTHLY, or ANNUALLY.",
      });
    }
    salaryPaymentFrequency = parsedFrequency.data;
  }

  const where: Prisma.AppointmentLetterWhereInput = {
    ...softDeleteWhere(status),
    ...(search
      ? {
          OR: [
            { recipientName: { contains: search, mode: "insensitive" as const } },
            { jobTitle: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(company
      ? { company: { equals: company, mode: "insensitive" as const } }
      : {}),
    ...(jobTitle
      ? { jobTitle: { equals: jobTitle, mode: "insensitive" as const } }
      : {}),
    ...(salaryPaymentFrequency ? { salaryPaymentFrequency } : {}),
  };

  const employeeRefRaw = req.query.employeeRefId;
  if (typeof employeeRefRaw === "string" && employeeRefRaw) {
    const employeeRefId = parseInt(employeeRefRaw, 10);
    if (Number.isNaN(employeeRefId)) {
      return res.status(400).json({ error: "Invalid employeeRefId" });
    }
    where.employeeRefId = employeeRefId;
  }

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

// GET /api/appointment-letters/:id?status=active|inactive|all
export async function getAppointmentLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const letter = await prisma.appointmentLetter.findFirst({
    where: { id, ...softDeleteWhere(status) },
  });
  if (!letter) {
    return res.status(404).json({ error: "Appointment letter not found" });
  }

  return res.json(withStatus(letter));
}

// PATCH /api/appointment-letters/:id
export async function updateAppointmentLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateAppointmentLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, ...fields } = parsed.data;
  const existing = await prisma.appointmentLetter.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Appointment letter not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'Appointment letter not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  if (fields.employeeRefId !== undefined) {
    const check = await assertActiveEmployeeRef(fields.employeeRefId);
    if (!check.ok) {
      return res.status(404).json({ error: check.error });
    }
  }

  const letter = await prisma.appointmentLetter.update({
    where: { id },
    data: {
      ...fields,
      ...(restore ? { deletedAt: null } : {}),
    },
  });

  return res.json(withStatus(letter));
}

// DELETE /api/appointment-letters/:id  (soft delete)
export async function deleteAppointmentLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.appointmentLetter.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Appointment letter not found" });
  }

  await prisma.appointmentLetter.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}
