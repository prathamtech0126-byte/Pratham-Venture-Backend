import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import {
  createEngagementLetterSchema,
  updateEngagementLetterSchema,
} from "../schemas/engagementLetter.schema";
import { parseId } from "../utils/parseId";
import { withPrismaEmployeeRef } from "../utils/prismaFields";
import { assertActiveEmployeeRef } from "../utils/assertEmployeeRef";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

// POST /api/engagement-letters
export async function createEngagementLetter(req: Request, res: Response) {
  const parsed = createEngagementLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const check = await assertActiveEmployeeRef(parsed.data.employeeRefId);
  if (!check.ok) {
    return res.status(404).json({ error: check.error });
  }

  const letter = await prisma.engagementLetter.create({ data: parsed.data });
  return res.status(201).json(withStatus(letter));
}

// GET /api/engagement-letters?page&limit&search&company&employeeRefId&status=
export async function listEngagementLetters(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const company = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.EngagementLetterWhereInput = {
    ...softDeleteWhere(status),
    ...(search ? { employeeName: { contains: search, mode: "insensitive" as const } } : {}),
    ...(company
      ? { company: { equals: company, mode: "insensitive" as const } }
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
    prisma.engagementLetter.count({ where }),
    prisma.engagementLetter.findMany({
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

// GET /api/engagement-letters/:id?status=active|inactive|all
export async function getEngagementLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const letter = await prisma.engagementLetter.findFirst({
    where: { id, ...softDeleteWhere(status) },
  });
  if (!letter) {
    return res.status(404).json({ error: "Engagement letter not found" });
  }

  return res.json(withStatus(letter));
}

// PATCH /api/engagement-letters/:id
export async function updateEngagementLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateEngagementLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, ...fields } = parsed.data;
  const existing = await prisma.engagementLetter.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Engagement letter not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'Engagement letter not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  if (fields.employeeRefId !== undefined) {
    const check = await assertActiveEmployeeRef(fields.employeeRefId);
    if (!check.ok) {
      return res.status(404).json({ error: check.error });
    }
  }

  const letter = await prisma.engagementLetter.update({
    where: { id },
    data: {
      ...withPrismaEmployeeRef(fields),
      ...(restore ? { deletedAt: null } : {}),
    } as Prisma.EngagementLetterUpdateInput,
  });

  return res.json(withStatus(letter));
}

// DELETE /api/engagement-letters/:id  (soft delete)
export async function deleteEngagementLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.engagementLetter.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Engagement letter not found" });
  }

  await prisma.engagementLetter.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}
