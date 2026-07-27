import { Request, Response } from "express";
import { Prisma, SubmissionStatus } from "@prisma/client";
import prisma from "../config/db";
import { contactSchema, updateSubmissionSchema } from "../schemas/submission.schema";
import { parseId } from "../utils/parseId";
import {
  parseSoftDeleteStatus,
  softDeleteWhere,
  withRecordStatus,
} from "../utils/softDelete";

const siteSelect = { id: true, name: true, slug: true } as const;

// PUBLIC — POST /api/contact
export async function createSubmission(req: Request, res: Response) {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { siteSlug, name, email, phone, subject, message } = parsed.data;

  const site = await prisma.site.findUnique({ where: { slug: siteSlug } });
  if (!site) {
    return res.status(404).json({ error: "Unknown site" });
  }

  const submission = await prisma.submission.create({
    data: { siteId: site.id, name, email, phone, subject, message },
  });

  return res.status(201).json({
    success: true,
    id: submission.id,
    message: `Thank you, ${name}! Your message has been received. Our team will get back to you soon.`,
  });
}

// GET /api/submissions?site=slug&status=NEW&recordStatus=active|inactive|all&page=1&limit=20
export async function listSubmissions(req: Request, res: Response) {
  const { site, status } = req.query;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const recordStatus = parseSoftDeleteStatus(req, "recordStatus");

  if (!recordStatus) {
    return res.status(400).json({ error: "Invalid recordStatus. Use active, inactive, or all." });
  }

  const where: Prisma.SubmissionWhereInput = {
    ...softDeleteWhere(recordStatus),
  };

  if (typeof site === "string" && site) {
    where.site = { slug: site };
  }
  if (typeof status === "string" && status) {
    if (!Object.values(SubmissionStatus).includes(status as SubmissionStatus)) {
      return res.status(400).json({ error: "Invalid status. Use NEW, READ or REPLIED." });
    }
    where.status = status as SubmissionStatus;
  }

  const [total, submissions] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      include: { site: { select: siteSelect } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({
    data: submissions.map(withRecordStatus),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/submissions/:id?recordStatus=active|inactive|all
export async function getSubmission(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const recordStatus = parseSoftDeleteStatus(req, "recordStatus");
  if (!recordStatus) {
    return res.status(400).json({ error: "Invalid recordStatus. Use active, inactive, or all." });
  }

  const submission = await prisma.submission.findFirst({
    where: { id, ...softDeleteWhere(recordStatus) },
    include: { site: { select: siteSelect } },
  });
  if (!submission) {
    return res.status(404).json({ error: "Submission not found" });
  }

  return res.json(withRecordStatus(submission));
}

// PATCH /api/submissions/:id
export async function updateSubmissionStatus(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid input. Use status NEW|READ|REPLIED and/or { "restore": true }.',
    });
  }

  const { status, restore } = parsed.data;
  const existing = await prisma.submission.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Submission not found" });
  }

  if (existing.deletedAt && !restore) {
    return res.status(404).json({
      error: 'Submission not found (inactive). Pass { "restore": true } to restore it.',
    });
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(restore ? { deletedAt: null } : {}),
    },
    include: { site: { select: siteSelect } },
  });

  return res.json(withRecordStatus(submission));
}

// DELETE /api/submissions/:id  (soft delete)
export async function deleteSubmission(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const existing = await prisma.submission.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ error: "Submission not found" });
  }

  await prisma.submission.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return res.json({ success: true });
}

// GET /api/stats
export async function getStats(_req: Request, res: Response) {
  const activeOnly = { deletedAt: null } as const;

  const [
    total,
    newCount,
    readCount,
    repliedCount,
    submissionInactive,
    perSiteCounts,
    sites,
    offerActive,
    offerInactive,
    slipActive,
    slipInactive,
    nocActive,
    nocInactive,
    evlActive,
    evlInactive,
    jdcActive,
    jdcInactive,
    apptActive,
    apptInactive,
    employeeActive,
    employeeInactive,
    companyActive,
    companyInactive,
    designationActive,
    designationInactive,
  ] = await Promise.all([
    prisma.submission.count({ where: activeOnly }),
    prisma.submission.count({ where: { ...activeOnly, status: SubmissionStatus.NEW } }),
    prisma.submission.count({ where: { ...activeOnly, status: SubmissionStatus.READ } }),
    prisma.submission.count({ where: { ...activeOnly, status: SubmissionStatus.REPLIED } }),
    prisma.submission.count({ where: { deletedAt: { not: null } } }),
    prisma.submission.groupBy({
      by: ["siteId", "status"],
      where: activeOnly,
      _count: { _all: true },
    }),
    prisma.site.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.offerLetter.count({ where: { deletedAt: null } }),
    prisma.offerLetter.count({ where: { deletedAt: { not: null } } }),
    prisma.salarySlip.count({ where: { deletedAt: null } }),
    prisma.salarySlip.count({ where: { deletedAt: { not: null } } }),
    prisma.nocCertificate.count({ where: { deletedAt: null } }),
    prisma.nocCertificate.count({ where: { deletedAt: { not: null } } }),
    prisma.employmentVerificationLetter.count({ where: { deletedAt: null } }),
    prisma.employmentVerificationLetter.count({ where: { deletedAt: { not: null } } }),
    prisma.jobDutyCertificate.count({ where: { deletedAt: null } }),
    prisma.jobDutyCertificate.count({ where: { deletedAt: { not: null } } }),
    prisma.appointmentLetter.count({ where: { deletedAt: null } }),
    prisma.appointmentLetter.count({ where: { deletedAt: { not: null } } }),
    prisma.employee.count({ where: { deletedAt: null } }),
    prisma.employee.count({ where: { deletedAt: { not: null } } }),
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.company.count({ where: { deletedAt: { not: null } } }),
    prisma.designation.count({ where: { deletedAt: null } }),
    prisma.designation.count({ where: { deletedAt: { not: null } } }),
  ]);

  const perSite = sites.map((site) => {
    const rows = perSiteCounts.filter((r) => r.siteId === site.id);
    const byStatus: Record<string, number> = { NEW: 0, READ: 0, REPLIED: 0 };
    let siteTotal = 0;
    for (const row of rows) {
      byStatus[row.status] = row._count._all;
      siteTotal += row._count._all;
    }
    return { ...site, total: siteTotal, byStatus };
  });

  return res.json({
    total,
    new: newCount,
    read: readCount,
    replied: repliedCount,
    inactive: submissionInactive,
    perSite,
    submissions: {
      total: total + submissionInactive,
      active: total,
      inactive: submissionInactive,
    },
    offerLetters: {
      total: offerActive + offerInactive,
      active: offerActive,
      inactive: offerInactive,
    },
    salarySlips: {
      total: slipActive + slipInactive,
      active: slipActive,
      inactive: slipInactive,
    },
    nocCertificates: {
      total: nocActive + nocInactive,
      active: nocActive,
      inactive: nocInactive,
    },
    employmentVerificationLetters: {
      total: evlActive + evlInactive,
      active: evlActive,
      inactive: evlInactive,
    },
    jobDutyCertificates: {
      total: jdcActive + jdcInactive,
      active: jdcActive,
      inactive: jdcInactive,
    },
    appointmentLetters: {
      total: apptActive + apptInactive,
      active: apptActive,
      inactive: apptInactive,
    },
    employees: {
      total: employeeActive + employeeInactive,
      active: employeeActive,
      inactive: employeeInactive,
    },
    companies: {
      total: companyActive + companyInactive,
      active: companyActive,
      inactive: companyInactive,
    },
    designations: {
      total: designationActive + designationInactive,
      active: designationActive,
      inactive: designationInactive,
    },
  });
}

// GET /api/sites
export async function listSites(_req: Request, res: Response) {
  const sites = await prisma.site.findMany({ orderBy: { id: "asc" } });
  return res.json(sites);
}
