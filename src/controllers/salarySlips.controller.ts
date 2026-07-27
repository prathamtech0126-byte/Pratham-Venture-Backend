import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import {
  createSalarySlipSchema,
  updateSalarySlipSchema,
} from "../schemas/salarySlip.schema";
import { parseId } from "../utils/parseId";
import { assertActiveEmployeeRef } from "../utils/assertEmployeeRef";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

// POST /api/salary-slips
export async function createSalarySlip(req: Request, res: Response) {
  const parsed = createSalarySlipSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const check = await assertActiveEmployeeRef(parsed.data.employeeRefId);
  if (!check.ok) {
    return res.status(404).json({ error: check.error });
  }

  const slip = await prisma.salarySlip.create({ data: parsed.data });
  return res.status(201).json(withStatus(slip));
}

// GET /api/salary-slips?page&limit&month&search&company&employeeRefId&status=
export async function listSalarySlips(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const month = typeof req.query.month === "string" ? req.query.month.trim() : "";
  const company = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid month. Use YYYY-MM." });
  }

  const where: Prisma.SalarySlipWhereInput = { ...softDeleteWhere(status) };
  if (month) where.month = month;
  if (company) {
    where.company = { equals: company, mode: "insensitive" };
  }

  const employeeRefRaw = req.query.employeeRefId;
  if (typeof employeeRefRaw === "string" && employeeRefRaw) {
    const employeeRefId = parseInt(employeeRefRaw, 10);
    if (Number.isNaN(employeeRefId)) {
      return res.status(400).json({ error: "Invalid employeeRefId" });
    }
    where.employeeRefId = employeeRefId;
  }

  if (search) {
    where.OR = [
      { employeeName: { contains: search, mode: "insensitive" } },
      { employeeId: { contains: search, mode: "insensitive" } },
    ];
  }

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

// GET /api/salary-slips/:id?status=active|inactive|all
export async function getSalarySlip(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const slip = await prisma.salarySlip.findFirst({
    where: { id, ...softDeleteWhere(status) },
  });
  if (!slip) {
    return res.status(404).json({ error: "Salary slip not found" });
  }

  return res.json(withStatus(slip));
}

// PATCH /api/salary-slips/:id
export async function updateSalarySlip(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateSalarySlipSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, ...fields } = parsed.data;
  const existing = await prisma.salarySlip.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Salary slip not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'Salary slip not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  if (fields.employeeRefId !== undefined) {
    const check = await assertActiveEmployeeRef(fields.employeeRefId);
    if (!check.ok) {
      return res.status(404).json({ error: check.error });
    }
  }

  const slip = await prisma.salarySlip.update({
    where: { id },
    data: {
      ...fields,
      ...(restore ? { deletedAt: null } : {}),
    },
  });

  return res.json(withStatus(slip));
}

// DELETE /api/salary-slips/:id  (soft delete)
export async function deleteSalarySlip(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.salarySlip.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Salary slip not found" });
  }

  await prisma.salarySlip.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}
