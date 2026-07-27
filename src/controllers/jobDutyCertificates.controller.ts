import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import {
  createJobDutyCertificateSchema,
  updateJobDutyCertificateSchema,
} from "../schemas/jobDutyCertificate.schema";
import { parseId } from "../utils/parseId";
import { assertActiveEmployeeRef } from "../utils/assertEmployeeRef";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

// POST /api/job-duty-certificates
export async function createJobDutyCertificate(req: Request, res: Response) {
  const parsed = createJobDutyCertificateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const check = await assertActiveEmployeeRef(parsed.data.employeeRefId);
  if (!check.ok) {
    return res.status(404).json({ error: check.error });
  }

  const certificate = await prisma.jobDutyCertificate.create({ data: parsed.data });
  return res.status(201).json(withStatus(certificate));
}

// GET /api/job-duty-certificates?page&limit&search&company&employeeRefId&registrationNo&status=
export async function listJobDutyCertificates(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const company = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const registrationNo =
    typeof req.query.registrationNo === "string" ? req.query.registrationNo.trim() : "";
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.JobDutyCertificateWhereInput = {
    ...softDeleteWhere(status),
    ...(search
      ? {
          OR: [
            { employeeName: { contains: search, mode: "insensitive" as const } },
            { registrationNo: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(company
      ? { company: { equals: company, mode: "insensitive" as const } }
      : {}),
    ...(registrationNo
      ? { registrationNo: { equals: registrationNo, mode: "insensitive" as const } }
      : {}),
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

// GET /api/job-duty-certificates/:id?status=active|inactive|all
export async function getJobDutyCertificate(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const certificate = await prisma.jobDutyCertificate.findFirst({
    where: { id, ...softDeleteWhere(status) },
  });
  if (!certificate) {
    return res.status(404).json({ error: "Job duty certificate not found" });
  }

  return res.json(withStatus(certificate));
}

// PATCH /api/job-duty-certificates/:id
export async function updateJobDutyCertificate(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateJobDutyCertificateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, ...fields } = parsed.data;
  const existing = await prisma.jobDutyCertificate.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Job duty certificate not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'Job duty certificate not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  if (fields.employeeRefId !== undefined) {
    const check = await assertActiveEmployeeRef(fields.employeeRefId);
    if (!check.ok) {
      return res.status(404).json({ error: check.error });
    }
  }

  const certificate = await prisma.jobDutyCertificate.update({
    where: { id },
    data: {
      ...fields,
      ...(restore ? { deletedAt: null } : {}),
    },
  });

  return res.json(withStatus(certificate));
}

// DELETE /api/job-duty-certificates/:id  (soft delete)
export async function deleteJobDutyCertificate(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.jobDutyCertificate.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Job duty certificate not found" });
  }

  await prisma.jobDutyCertificate.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}
