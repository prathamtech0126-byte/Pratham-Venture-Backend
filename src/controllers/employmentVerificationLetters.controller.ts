import { Request, Response } from "express";
import { EmploymentStatus, Prisma } from "@prisma/client";
import prisma from "../config/db";
import {
  createEmploymentVerificationLetterSchema,
  employmentStatusSchema,
  updateEmploymentVerificationLetterSchema,
} from "../schemas/employmentVerificationLetter.schema";
import { parseId } from "../utils/parseId";
import { withPrismaEmployeeRef } from "../utils/prismaFields";
import { assertActiveEmployeeRef } from "../utils/assertEmployeeRef";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

// POST /api/employment-verification-letters
export async function createEmploymentVerificationLetter(req: Request, res: Response) {
  const parsed = createEmploymentVerificationLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const check = await assertActiveEmployeeRef(parsed.data.employeeRefId);
  if (!check.ok) {
    return res.status(404).json({ error: check.error });
  }

  const letter = await prisma.employmentVerificationLetter.create({ data: parsed.data });
  return res.status(201).json(withStatus(letter));
}

// GET /api/employment-verification-letters?page&limit&search&company&employeeRefId&recipientOrganization&employmentStatus&status=
export async function listEmploymentVerificationLetters(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const company = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const recipientOrganization =
    typeof req.query.recipientOrganization === "string"
      ? req.query.recipientOrganization.trim()
      : "";
  const employmentStatusRaw =
    typeof req.query.employmentStatus === "string" ? req.query.employmentStatus.trim() : "";
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  let employmentStatus: EmploymentStatus | undefined;
  if (employmentStatusRaw) {
    const parsedStatus = employmentStatusSchema.safeParse(employmentStatusRaw);
    if (!parsedStatus.success) {
      return res.status(400).json({
        error: "Invalid employmentStatus. Use FULL_TIME, PART_TIME, CONTRACT, or INTERN.",
      });
    }
    employmentStatus = parsedStatus.data;
  }

  const where: Prisma.EmploymentVerificationLetterWhereInput = {
    ...softDeleteWhere(status),
    ...(search ? { employeeName: { contains: search, mode: "insensitive" as const } } : {}),
    ...(company
      ? { company: { equals: company, mode: "insensitive" as const } }
      : {}),
    ...(recipientOrganization
      ? {
          recipientOrganization: {
            equals: recipientOrganization,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(employmentStatus ? { employmentStatus } : {}),
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

// GET /api/employment-verification-letters/:id?status=active|inactive|all
export async function getEmploymentVerificationLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const letter = await prisma.employmentVerificationLetter.findFirst({
    where: { id, ...softDeleteWhere(status) },
  });
  if (!letter) {
    return res.status(404).json({ error: "Employment verification letter not found" });
  }

  return res.json(withStatus(letter));
}

// PATCH /api/employment-verification-letters/:id
export async function updateEmploymentVerificationLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateEmploymentVerificationLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, ...fields } = parsed.data;
  const existing = await prisma.employmentVerificationLetter.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Employment verification letter not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error:
        'Employment verification letter not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  if (fields.employeeRefId !== undefined) {
    const check = await assertActiveEmployeeRef(fields.employeeRefId);
    if (!check.ok) {
      return res.status(404).json({ error: check.error });
    }
  }

  const letter = await prisma.employmentVerificationLetter.update({
    where: { id },
    data: {
      ...withPrismaEmployeeRef(fields),
      ...(restore ? { deletedAt: null } : {}),
    } as Prisma.EmploymentVerificationLetterUpdateInput,
  });

  return res.json(withStatus(letter));
}

// DELETE /api/employment-verification-letters/:id  (soft delete)
export async function deleteEmploymentVerificationLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.employmentVerificationLetter.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Employment verification letter not found" });
  }

  await prisma.employmentVerificationLetter.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}
