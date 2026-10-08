import { Request, Response } from "express";
import { Prisma, Workspace } from "@prisma/client";
import prisma from "../config/db";
import { getContext } from "../utils/requestContext";
import {
  createDesignationSchema,
  updateDesignationSchema,
} from "../schemas/designation.schema";
import { parseId } from "../utils/parseId";
import { parseSoftDeleteStatus, softDeleteWhere, withStatus } from "../utils/softDelete";

const companySelect = { id: true, name: true } as const;

/**
 * JD fields to write, or an error when sent outside the HR workspace.
 * Empty strings clear the field.
 */
function jobDescriptionData(input: {
  jobDescription?: string | null;
  jobSummary?: string | null;
}): { data: { jobDescription?: string | null; jobSummary?: string | null } } | { error: string } {
  const touched = input.jobDescription !== undefined || input.jobSummary !== undefined;
  if (!touched) return { data: {} };
  if (getContext()?.workspace !== Workspace.HR) {
    return { error: "Job descriptions are only available in the HR (Pratham International) workspace." };
  }
  const clean = (v: string | null | undefined) =>
    v === undefined ? undefined : v?.trim() ? v.trim() : null;
  return {
    data: {
      ...(input.jobDescription !== undefined ? { jobDescription: clean(input.jobDescription) } : {}),
      ...(input.jobSummary !== undefined ? { jobSummary: clean(input.jobSummary) } : {}),
    },
  };
}

// POST /api/designations
export async function createDesignation(req: Request, res: Response) {
  const parsed = createDesignationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const name = parsed.data.name.trim();
  const { companyId } = parsed.data;
  const jd = jobDescriptionData(parsed.data);
  if ("error" in jd) {
    return res.status(403).json({ error: jd.error });
  }

  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
  });
  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  const existing = await prisma.designation.findFirst({
    where: {
      companyId,
      name: { equals: name, mode: "insensitive" },
    },
  });
  if (existing && !existing.deletedAt) {
    return res.status(409).json({ error: "This designation already exists." });
  }
  if (existing?.deletedAt) {
    const restored = await prisma.designation.update({
      where: { id: existing.id },
      data: { name, deletedAt: null, ...jd.data },
      include: { company: { select: companySelect } },
    });
    return res.status(201).json(withStatus(restored));
  }

  const designation = await prisma.designation.create({
    data: {
      companyId,
      name,
      ...jd.data,
    },
    include: { company: { select: companySelect } },
  });
  return res.status(201).json(withStatus(designation));
}

// GET /api/designations?companyId=&company=&page&limit&search&status=
export async function listDesignations(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const companyName = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const companyIdRaw = req.query.companyId;
  const status = parseSoftDeleteStatus(req);

  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const where: Prisma.DesignationWhereInput = { ...softDeleteWhere(status) };

  if (typeof companyIdRaw === "string" && companyIdRaw) {
    const companyId = parseInt(companyIdRaw, 10);
    if (Number.isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid companyId" });
    }
    where.companyId = companyId;
  } else if (companyName) {
    where.company = {
      name: { equals: companyName, mode: "insensitive" },
      deletedAt: null,
    };
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [total, rows] = await Promise.all([
    prisma.designation.count({ where }),
    prisma.designation.findMany({
      where,
      include: { company: { select: companySelect } },
      orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Full JD HTML is fetched per designation (GET /:id or /job-description) — lists only flag it.
  return res.json({
    data: rows.map(({ jobDescription, ...row }) => ({
      ...withStatus(row),
      hasJobDescription: Boolean(jobDescription),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

/**
 * GET /api/designations/job-description?companyId=1&name=Visa%20Counsellor
 * JD + offer-letter summary for the designation picked on a document form.
 * Returns nulls (not 404) when the designation has no JD, so forms can prefill blindly.
 */
export async function getDesignationJobDescription(req: Request, res: Response) {
  const companyId = parseInt(String(req.query.companyId ?? ""), 10);
  const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
  if (Number.isNaN(companyId) || !name) {
    return res.status(400).json({ error: "Query params companyId and name are required" });
  }

  const designation = await prisma.designation.findFirst({
    where: { companyId, deletedAt: null, name: { equals: name, mode: "insensitive" } },
    select: { id: true, name: true, jobDescription: true, jobSummary: true },
  });
  return res.json({
    id: designation?.id ?? null,
    name: designation?.name ?? name,
    jobDescription: designation?.jobDescription ?? null,
    jobSummary: designation?.jobSummary ?? null,
  });
}

/**
 * GET /api/designations/by-company?companyId=1
 * or ?company=Inkline%20Digital%20Solutions
 * Lightweight list for Employee / Offer Letter / Salary Slip dropdowns.
 */
export async function listDesignationsByCompany(req: Request, res: Response) {
  const companyName = typeof req.query.company === "string" ? req.query.company.trim() : "";
  const companyIdRaw = req.query.companyId;

  let companyId: number | null = null;

  if (typeof companyIdRaw === "string" && companyIdRaw) {
    companyId = parseInt(companyIdRaw, 10);
    if (Number.isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid companyId" });
    }
  } else if (companyName) {
    const company = await prisma.company.findFirst({
      where: {
        deletedAt: null,
        name: { equals: companyName, mode: "insensitive" },
      },
    });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    companyId = company.id;
  } else {
    return res.status(400).json({ error: "Query param companyId or company is required" });
  }

  const rows = await prisma.designation.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, companyId: true, name: true },
  });

  return res.json({ data: rows });
}

// GET /api/designations/:id
export async function getDesignation(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const status = parseSoftDeleteStatus(req);
  if (!status) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const designation = await prisma.designation.findFirst({
    where: { id, ...softDeleteWhere(status) },
    include: { company: { select: companySelect } },
  });
  if (!designation) {
    return res.status(404).json({ error: "Designation not found" });
  }

  return res.json(withStatus(designation));
}

// PATCH /api/designations/:id
export async function updateDesignation(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateDesignationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { restore, name, companyId } = parsed.data;
  const jd = jobDescriptionData(parsed.data);
  if ("error" in jd) {
    return res.status(403).json({ error: jd.error });
  }
  const existing = await prisma.designation.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Designation not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'Designation not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  const nextCompanyId = companyId ?? existing.companyId;
  const nextName = name?.trim() ?? existing.name;

  if (companyId !== undefined) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
    });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
  }

  const clash = await prisma.designation.findFirst({
    where: {
      id: { not: id },
      companyId: nextCompanyId,
      deletedAt: null,
      name: { equals: nextName, mode: "insensitive" },
    },
  });
  if (clash) {
    return res.status(400).json({ error: "Designation already exists for this company" });
  }

  const designation = await prisma.designation.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(companyId !== undefined ? { companyId } : {}),
      ...(restore ? { deletedAt: null } : {}),
      ...jd.data,
    },
    include: { company: { select: companySelect } },
  });

  return res.json(withStatus(designation));
}

// DELETE /api/designations/:id
export async function deleteDesignation(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.designation.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Designation not found" });
  }

  await prisma.designation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}
