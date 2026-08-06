import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import {
  createPromotionLetterSchema,
  updatePromotionLetterSchema,
} from "../schemas/promotionLetter.schema";
import { parseId } from "../utils/parseId";
import { withPrismaEmployeeRef } from "../utils/prismaFields";
import { assertActiveEmployeeRef } from "../utils/assertEmployeeRef";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

// POST /api/promotion-letters
export async function createPromotionLetter(req: Request, res: Response) {
  const parsed = createPromotionLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const check = await assertActiveEmployeeRef(parsed.data.employeeRefId);
  if (!check.ok) {
    return res.status(404).json({ error: check.error });
  }

  const letter = await prisma.promotionLetter.create({ data: parsed.data });
  return res.status(201).json(withStatus(letter));
}

// GET /api/promotion-letters?page&limit&search&company&employeeRefId&status=
export async function listPromotionLetters(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const company = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.PromotionLetterWhereInput = {
    ...softDeleteWhere(status),
    ...(search
      ? {
          OR: [
            { employeeName: { contains: search, mode: "insensitive" as const } },
            { newDesignation: { contains: search, mode: "insensitive" as const } },
            { previousDesignation: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
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

// GET /api/promotion-letters/:id?status=active|inactive|all
export async function getPromotionLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const letter = await prisma.promotionLetter.findFirst({
    where: { id, ...softDeleteWhere(status) },
  });
  if (!letter) {
    return res.status(404).json({ error: "Promotion letter not found" });
  }

  return res.json(withStatus(letter));
}

// PATCH /api/promotion-letters/:id
export async function updatePromotionLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updatePromotionLetterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, ...fields } = parsed.data;
  const existing = await prisma.promotionLetter.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Promotion letter not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'Promotion letter not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  if (fields.employeeRefId !== undefined) {
    const check = await assertActiveEmployeeRef(fields.employeeRefId);
    if (!check.ok) {
      return res.status(404).json({ error: check.error });
    }
  }

  const letter = await prisma.promotionLetter.update({
    where: { id },
    data: {
      ...withPrismaEmployeeRef(fields),
      ...(restore ? { deletedAt: null } : {}),
    } as Prisma.PromotionLetterUpdateInput,
  });

  return res.json(withStatus(letter));
}

// DELETE /api/promotion-letters/:id  (soft delete)
export async function deletePromotionLetter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.promotionLetter.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Promotion letter not found" });
  }

  await prisma.promotionLetter.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}
