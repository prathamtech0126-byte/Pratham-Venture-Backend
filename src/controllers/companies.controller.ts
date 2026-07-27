import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";
import { createCompanySchema, updateCompanySchema } from "../schemas/company.schema";
import { parseId } from "../utils/parseId";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

// POST /api/companies
export async function createCompany(req: Request, res: Response) {
  const parsed = createCompanySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const name = parsed.data.name.trim();

  const existing = await prisma.company.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing && !existing.deletedAt) {
    return res.status(400).json({ error: "Company already exists" });
  }
  if (existing?.deletedAt) {
    const restored = await prisma.company.update({
      where: { id: existing.id },
      data: { name, deletedAt: null },
    });
    return res.status(201).json(withStatus(restored));
  }

  const company = await prisma.company.create({ data: { name } });
  return res.status(201).json(withStatus(company));
}

// GET /api/companies?page&limit&search&status=active|inactive|all
export async function listCompanies(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.CompanyWhereInput = {
    ...softDeleteWhere(status),
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { designations: { where: { deletedAt: null } } },
        },
      },
    }),
  ]);

  return res.json({
    data: rows.map((row) => {
      const { _count, ...company } = row;
      return {
        ...withStatus(company),
        designationCount: _count.designations,
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/companies/:id
export async function getCompany(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const company = await prisma.company.findFirst({
    where: { id, ...softDeleteWhere(status) },
    include: {
      designations: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  return res.json(withStatus(company));
}

// PATCH /api/companies/:id
export async function updateCompany(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateCompanySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, name } = parsed.data;
  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Company not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'Company not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  if (name) {
    const clash = await prisma.company.findFirst({
      where: {
        id: { not: id },
        deletedAt: null,
        name: { equals: name.trim(), mode: "insensitive" },
      },
    });
    if (clash) {
      return res.status(400).json({ error: "Another company with this name already exists" });
    }
  }

  const company = await prisma.company.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(restore ? { deletedAt: null } : {}),
    },
  });

  return res.json(withStatus(company));
}

// DELETE /api/companies/:id  (soft delete company + its designations)
export async function deleteCompany(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.company.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Company not found" });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.designation.updateMany({
      where: { companyId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.company.update({
      where: { id },
      data: { deletedAt: now },
    }),
  ]);

  return res.json({ success: true });
}
