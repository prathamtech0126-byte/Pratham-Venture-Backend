import { Request, Response } from "express";
import { Prisma, PurposeOfVisit } from "@prisma/client";
import prisma from "../config/db";
import {
  createNocCertificateSchema,
  purposeOfVisitSchema,
  updateNocCertificateSchema,
} from "../schemas/nocCertificate.schema";
import { parseId } from "../utils/parseId";
import { withPrismaEmployeeRef } from "../utils/prismaFields";
import { assertActiveEmployeeRef } from "../utils/assertEmployeeRef";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

// POST /api/noc-certificates
export async function createNocCertificate(req: Request, res: Response) {
  const parsed = createNocCertificateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const check = await assertActiveEmployeeRef(parsed.data.employeeRefId);
  if (!check.ok) {
    return res.status(404).json({ error: check.error });
  }

  const certificate = await prisma.nocCertificate.create({ data: parsed.data });
  return res.status(201).json(withStatus(certificate));
}

// GET /api/noc-certificates?page&limit&search&company&employeeRefId&destinationCountry&purposeOfVisit&status=
export async function listNocCertificates(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const company = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const destinationCountry =
    typeof req.query.destinationCountry === "string" ? req.query.destinationCountry.trim() : "";
  const purposeRaw =
    typeof req.query.purposeOfVisit === "string" ? req.query.purposeOfVisit.trim() : "";
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  let purposeOfVisit: PurposeOfVisit | undefined;
  if (purposeRaw) {
    const parsedPurpose = purposeOfVisitSchema.safeParse(purposeRaw);
    if (!parsedPurpose.success) {
      return res.status(400).json({
        error:
          "Invalid purposeOfVisit. Use TOURISM, BUSINESS, EDUCATION, MEDICAL, FAMILY, or OTHER.",
      });
    }
    purposeOfVisit = parsedPurpose.data;
  }

  const where: Prisma.NocCertificateWhereInput = {
    ...softDeleteWhere(status),
    ...(search ? { employeeName: { contains: search, mode: "insensitive" as const } } : {}),
    ...(company
      ? { company: { equals: company, mode: "insensitive" as const } }
      : {}),
    ...(destinationCountry
      ? { destinationCountry: { equals: destinationCountry, mode: "insensitive" as const } }
      : {}),
    ...(purposeOfVisit ? { purposeOfVisit } : {}),
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

// GET /api/noc-certificates/:id?status=active|inactive|all
export async function getNocCertificate(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const certificate = await prisma.nocCertificate.findFirst({
    where: { id, ...softDeleteWhere(status) },
  });
  if (!certificate) {
    return res.status(404).json({ error: "NOC certificate not found" });
  }

  return res.json(withStatus(certificate));
}

// PATCH /api/noc-certificates/:id
export async function updateNocCertificate(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateNocCertificateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, ...fields } = parsed.data;
  const existing = await prisma.nocCertificate.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "NOC certificate not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'NOC certificate not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  if (fields.employeeRefId !== undefined) {
    const check = await assertActiveEmployeeRef(fields.employeeRefId);
    if (!check.ok) {
      return res.status(404).json({ error: check.error });
    }
  }

  const certificate = await prisma.nocCertificate.update({
    where: { id },
    data: {
      ...withPrismaEmployeeRef(fields),
      ...(restore ? { deletedAt: null } : {}),
    } as Prisma.NocCertificateUpdateInput,
  });

  return res.json(withStatus(certificate));
}

// DELETE /api/noc-certificates/:id  (soft delete)
export async function deleteNocCertificate(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.nocCertificate.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "NOC certificate not found" });
  }

  await prisma.nocCertificate.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}
