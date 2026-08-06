import { Response } from "express";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/auth.middleware";
import { saveRecentSearchSchema } from "../schemas/search.schema";
import { parseSoftDeleteStatus } from "../utils/softDelete";
import {
  SearchResultItem,
  SearchType,
  buildEmployeeActions,
  buildTextOrWhere,
  extractMonthPatterns,
  formatMonthLabel,
  formatSubmissionDate,
  groupResults,
  parseSearchTerms,
  parseSearchTypes,
  recordStatusWhere,
  resolveRecordStatus,
  sortResults,
} from "../utils/search";

const PER_TYPE_FETCH = 8;
const MAX_RECENT_STORED = 20;

async function trimSearchHistory(adminId: number) {
  const excess = await prisma.searchHistory.findMany({
    where: { adminId },
    orderBy: { createdAt: "desc" },
    skip: MAX_RECENT_STORED,
    select: { id: true },
  });

  if (excess.length === 0) return;

  await prisma.searchHistory.deleteMany({
    where: { id: { in: excess.map((row) => row.id) } },
  });
}

function employeeWhere(terms: string[]) {
  return buildTextOrWhere(terms, [
    (term) => ({ name: { contains: term, mode: "insensitive" } }),
    (term) => ({ employeeCode: { contains: term, mode: "insensitive" } }),
    (term) => ({ company: { contains: term, mode: "insensitive" } }),
    (term) => ({ designation: { contains: term, mode: "insensitive" } }),
    (term) => ({ department: { contains: term, mode: "insensitive" } }),
  ]);
}

function offerLetterWhere(terms: string[]) {
  return buildTextOrWhere(terms, [
    (term) => ({ candidateName: { contains: term, mode: "insensitive" } }),
    (term) => ({ position: { contains: term, mode: "insensitive" } }),
    (term) => ({ company: { contains: term, mode: "insensitive" } }),
    (term) => ({ department: { contains: term, mode: "insensitive" } }),
  ]);
}

function salarySlipWhere(terms: string[], query: string) {
  const monthPatterns = extractMonthPatterns(query);
  return buildTextOrWhere(terms, [
    (term) => ({ employeeName: { contains: term, mode: "insensitive" } }),
    (term) => ({ employeeId: { contains: term, mode: "insensitive" } }),
    (term) => ({ company: { contains: term, mode: "insensitive" } }),
    (term) => ({ month: { contains: term, mode: "insensitive" } }),
    ...monthPatterns.map(
      (pattern) => () => ({ month: { contains: pattern, mode: "insensitive" } })
    ),
  ]);
}

function nocCertificateWhere(terms: string[]) {
  return buildTextOrWhere(terms, [
    (term) => ({ employeeName: { contains: term, mode: "insensitive" } }),
    (term) => ({ destinationCountry: { contains: term, mode: "insensitive" } }),
    (term) => ({ company: { contains: term, mode: "insensitive" } }),
  ]);
}

function employmentVerificationWhere(terms: string[]) {
  return buildTextOrWhere(terms, [
    (term) => ({ employeeName: { contains: term, mode: "insensitive" } }),
    (term) => ({ recipientOrganization: { contains: term, mode: "insensitive" } }),
    (term) => ({ company: { contains: term, mode: "insensitive" } }),
  ]);
}

function jobDutyCertificateWhere(terms: string[]) {
  return buildTextOrWhere(terms, [
    (term) => ({ employeeName: { contains: term, mode: "insensitive" } }),
    (term) => ({ registrationNo: { contains: term, mode: "insensitive" } }),
    (term) => ({ company: { contains: term, mode: "insensitive" } }),
  ]);
}

function appointmentLetterWhere(terms: string[]) {
  return buildTextOrWhere(terms, [
    (term) => ({ recipientName: { contains: term, mode: "insensitive" } }),
    (term) => ({ jobTitle: { contains: term, mode: "insensitive" } }),
    (term) => ({ company: { contains: term, mode: "insensitive" } }),
  ]);
}

function promotionLetterWhere(terms: string[]) {
  return buildTextOrWhere(terms, [
    (term) => ({ employeeName: { contains: term, mode: "insensitive" } }),
    (term) => ({ newDesignation: { contains: term, mode: "insensitive" } }),
    (term) => ({ previousDesignation: { contains: term, mode: "insensitive" } }),
    (term) => ({ company: { contains: term, mode: "insensitive" } }),
  ]);
}

function submissionWhere(terms: string[]) {
  return buildTextOrWhere(terms, [
    (term) => ({ name: { contains: term, mode: "insensitive" } }),
    (term) => ({ email: { contains: term, mode: "insensitive" } }),
    (term) => ({ subject: { contains: term, mode: "insensitive" } }),
    (term) => ({ message: { contains: term, mode: "insensitive" } }),
    (term) => ({ site: { name: { contains: term, mode: "insensitive" } } }),
  ]);
}

async function searchEmployees(
  terms: string[],
  recordStatus: ReturnType<typeof resolveRecordStatus>
): Promise<SearchResultItem[]> {
  const rows = await prisma.employee.findMany({
    where: {
      ...recordStatusWhere(recordStatus!),
      ...employeeWhere(terms),
    },
    orderBy: [{ deletedAt: "asc" }, { name: "asc" }],
    take: PER_TYPE_FETCH,
  });

  return rows.map((row) => {
    const status = row.deletedAt ? "inactive" : "active";
    const subtitleParts = [row.company, row.designation].filter(Boolean);
    const metaParts = [
      row.employeeCode ?? undefined,
      status === "active" ? "Active" : "Inactive",
    ].filter(Boolean);

    return {
      id: String(row.id),
      type: "employee" as const,
      title: row.name,
      subtitle: subtitleParts.join(" · ") || undefined,
      meta: metaParts.join(" · ") || undefined,
      url: `/employees/${row.id}`,
      status,
    };
  });
}

async function searchOfferLetters(
  terms: string[],
  recordStatus: ReturnType<typeof resolveRecordStatus>
): Promise<SearchResultItem[]> {
  const rows = await prisma.offerLetter.findMany({
    where: {
      ...recordStatusWhere(recordStatus!),
      ...offerLetterWhere(terms),
    },
    orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    take: PER_TYPE_FETCH,
  });

  return rows.map((row) => {
    const status = row.deletedAt ? "inactive" : "active";
    const subtitleParts = [row.company, row.department].filter(Boolean);
    return {
      id: String(row.id),
      type: "offer_letter" as const,
      title: row.candidateName,
      subtitle: subtitleParts.join(" · ") || undefined,
      meta: [row.position, status === "active" ? "Active" : "Inactive"].filter(Boolean).join(" · "),
      url: `/offer-letter/create?id=${row.id}`,
      status,
    };
  });
}

async function searchSalarySlips(
  terms: string[],
  query: string,
  recordStatus: ReturnType<typeof resolveRecordStatus>
): Promise<SearchResultItem[]> {
  const rows = await prisma.salarySlip.findMany({
    where: {
      ...recordStatusWhere(recordStatus!),
      ...salarySlipWhere(terms, query),
    },
    orderBy: [{ deletedAt: "asc" }, { month: "desc" }],
    take: PER_TYPE_FETCH,
  });

  return rows.map((row) => {
    const status = row.deletedAt ? "inactive" : "active";
    return {
      id: String(row.id),
      type: "salary_slip" as const,
      title: `${row.employeeName} — ${formatMonthLabel(row.month)}`,
      subtitle: row.company,
      meta: `Salary slip · ${status === "active" ? "Active" : "Inactive"}`,
      url: `/salary-slip/create?id=${row.id}`,
      status,
    };
  });
}

async function searchNocCertificates(
  terms: string[],
  recordStatus: ReturnType<typeof resolveRecordStatus>
): Promise<SearchResultItem[]> {
  const rows = await prisma.nocCertificate.findMany({
    where: {
      ...recordStatusWhere(recordStatus!),
      ...nocCertificateWhere(terms),
    },
    orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    take: PER_TYPE_FETCH,
  });

  return rows.map((row) => {
    const status = row.deletedAt ? "inactive" : "active";
    return {
      id: String(row.id),
      type: "noc_certificate" as const,
      title: row.employeeName,
      subtitle: row.company,
      meta: [row.destinationCountry, status === "active" ? "Active" : "Inactive"]
        .filter(Boolean)
        .join(" · "),
      url: `/noc-certificate/create?id=${row.id}`,
      status,
    };
  });
}

async function searchEmploymentVerificationLetters(
  terms: string[],
  recordStatus: ReturnType<typeof resolveRecordStatus>
): Promise<SearchResultItem[]> {
  const rows = await prisma.employmentVerificationLetter.findMany({
    where: {
      ...recordStatusWhere(recordStatus!),
      ...employmentVerificationWhere(terms),
    },
    orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    take: PER_TYPE_FETCH,
  });

  return rows.map((row) => {
    const status = row.deletedAt ? "inactive" : "active";
    return {
      id: String(row.id),
      type: "employment_verification_letter" as const,
      title: row.employeeName,
      subtitle: row.recipientOrganization ?? row.company,
      meta: `Employment verification · ${status === "active" ? "Active" : "Inactive"}`,
      url: `/employment-verification-letter/create?id=${row.id}`,
      status,
    };
  });
}

async function searchJobDutyCertificates(
  terms: string[],
  recordStatus: ReturnType<typeof resolveRecordStatus>
): Promise<SearchResultItem[]> {
  const rows = await prisma.jobDutyCertificate.findMany({
    where: {
      ...recordStatusWhere(recordStatus!),
      ...jobDutyCertificateWhere(terms),
    },
    orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    take: PER_TYPE_FETCH,
  });

  return rows.map((row) => {
    const status = row.deletedAt ? "inactive" : "active";
    const metaParts = [row.registrationNo, status === "active" ? "Active" : "Inactive"].filter(
      Boolean
    );
    return {
      id: String(row.id),
      type: "job_duty_certificate" as const,
      title: row.employeeName,
      subtitle: row.company,
      meta: metaParts.join(" · ") || undefined,
      url: `/job-duty-certificate/create?id=${row.id}`,
      status,
    };
  });
}

async function searchAppointmentLetters(
  terms: string[],
  recordStatus: ReturnType<typeof resolveRecordStatus>
): Promise<SearchResultItem[]> {
  const rows = await prisma.appointmentLetter.findMany({
    where: {
      ...recordStatusWhere(recordStatus!),
      ...appointmentLetterWhere(terms),
    },
    orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    take: PER_TYPE_FETCH,
  });

  return rows.map((row) => {
    const status = row.deletedAt ? "inactive" : "active";
    return {
      id: String(row.id),
      type: "appointment_letter" as const,
      title: row.recipientName,
      subtitle: row.company,
      meta: [row.jobTitle, status === "active" ? "Active" : "Inactive"].filter(Boolean).join(" · "),
      url: `/appointment-letter/create?id=${row.id}`,
      status,
    };
  });
}

async function searchPromotionLetters(
  terms: string[],
  recordStatus: ReturnType<typeof resolveRecordStatus>
): Promise<SearchResultItem[]> {
  const rows = await prisma.promotionLetter.findMany({
    where: {
      ...recordStatusWhere(recordStatus!),
      ...promotionLetterWhere(terms),
    },
    orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    take: PER_TYPE_FETCH,
  });

  return rows.map((row) => {
    const status = row.deletedAt ? "inactive" : "active";
    return {
      id: String(row.id),
      type: "promotion_letter" as const,
      title: row.employeeName,
      subtitle: row.company,
      meta: [row.newDesignation, status === "active" ? "Active" : "Inactive"]
        .filter(Boolean)
        .join(" · "),
      url: `/promotion-letter/create?id=${row.id}`,
      status,
    };
  });
}

async function searchSubmissions(
  terms: string[],
  recordStatus: ReturnType<typeof resolveRecordStatus>
): Promise<SearchResultItem[]> {
  const rows = await prisma.submission.findMany({
    where: {
      ...recordStatusWhere(recordStatus!),
      ...submissionWhere(terms),
    },
    include: { site: { select: { name: true } } },
    orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    take: PER_TYPE_FETCH,
  });

  return rows.map((row) => {
    const title = row.subject?.trim()
      ? row.subject
      : `Website inquiry from ${row.name}`;

    return {
      id: String(row.id),
      type: "submission" as const,
      title,
      subtitle: row.site.name,
      meta: `${row.status} · ${formatSubmissionDate(row.createdAt)}`,
      url: `/submissions/${row.id}`,
      status: row.deletedAt ? "inactive" : row.status,
    };
  });
}

const SEARCH_HANDLERS: Record<
  SearchType,
  (
    terms: string[],
    query: string,
    recordStatus: ReturnType<typeof resolveRecordStatus>
  ) => Promise<SearchResultItem[]>
> = {
  employee: (terms, _query, recordStatus) => searchEmployees(terms, recordStatus),
  offer_letter: (terms, _query, recordStatus) => searchOfferLetters(terms, recordStatus),
  salary_slip: (terms, query, recordStatus) => searchSalarySlips(terms, query, recordStatus),
  noc_certificate: (terms, _query, recordStatus) => searchNocCertificates(terms, recordStatus),
  employment_verification_letter: (terms, _query, recordStatus) =>
    searchEmploymentVerificationLetters(terms, recordStatus),
  job_duty_certificate: (terms, _query, recordStatus) =>
    searchJobDutyCertificates(terms, recordStatus),
  appointment_letter: (terms, _query, recordStatus) =>
    searchAppointmentLetters(terms, recordStatus),
  promotion_letter: (terms, _query, recordStatus) =>
    searchPromotionLetters(terms, recordStatus),
  submission: (terms, _query, recordStatus) => searchSubmissions(terms, recordStatus),
};

/**
 * GET /api/search?q=harsh&limit=10&types=employee,salary_slip&status=active
 */
export async function globalSearch(req: AuthRequest, res: Response) {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 2) {
    return res.status(400).json({ error: "Query must be at least 2 characters." });
  }

  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10));
  const types = parseSearchTypes(typeof req.query.types === "string" ? req.query.types : undefined);
  if (!types) {
    return res.status(400).json({ error: "Invalid types filter." });
  }

  const statusParam = parseSoftDeleteStatus(req);
  if (req.query.status !== undefined && !statusParam) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const recordStatus = resolveRecordStatus(query, statusParam);
  if (!recordStatus) {
    return res.status(400).json({ error: "Invalid status. Use active, inactive, or all." });
  }

  const terms = parseSearchTerms(query);
  if (terms.length === 0) {
    return res.status(400).json({ error: "Query must contain searchable terms." });
  }

  const batches = await Promise.all(
    types.map((type) => SEARCH_HANDLERS[type](terms, query, recordStatus))
  );

  const merged = batches.flat();
  const ranked = sortResults(merged, terms, query.toLowerCase()).slice(0, limit);
  const groups = groupResults(ranked);

  const employeeMatches = ranked.filter((item) => item.type === "employee");
  const employeeRows =
    employeeMatches.length > 0
      ? employeeMatches.map((item) => ({ id: Number(item.id), name: item.title }))
      : types.includes("employee")
        ? (
            await prisma.employee.findMany({
              where: {
                ...recordStatusWhere(recordStatus),
                ...employeeWhere(terms),
              },
              select: { id: true, name: true },
              take: 3,
            })
          ).map((row) => ({ id: row.id, name: row.name }))
        : [];

  const actions = buildEmployeeActions(employeeRows, query);

  const payload: {
    query: string;
    results: SearchResultItem[];
    groups: ReturnType<typeof groupResults>;
    actions?: ReturnType<typeof buildEmployeeActions>;
  } = {
    query,
    results: ranked,
    groups,
  };

  if (actions.length > 0) {
    payload.actions = actions;
  }

  return res.json(payload);
}

/**
 * GET /api/search/recent?limit=10
 */
export async function listRecentSearches(req: AuthRequest, res: Response) {
  const adminId = req.admin?.id;
  if (!adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10));

  const rows = await prisma.searchHistory.findMany({
    where: { adminId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { query: true, createdAt: true },
  });

  return res.json({
    recent: rows.map((row) => ({
      query: row.query,
      searchedAt: row.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/search/recent  { "query": "harsh" }
 */
export async function saveRecentSearch(req: AuthRequest, res: Response) {
  const adminId = req.admin?.id;
  if (!adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = saveRecentSearchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const query = parsed.data.query.trim();
  const existing = await prisma.searchHistory.findFirst({
    where: {
      adminId,
      query: { equals: query, mode: "insensitive" },
    },
  });

  const row = existing
    ? await prisma.searchHistory.update({
        where: { id: existing.id },
        data: { query, createdAt: new Date() },
      })
    : await prisma.searchHistory.create({
        data: { adminId, query },
      });

  await trimSearchHistory(adminId);

  return res.status(existing ? 200 : 201).json({
    query: row.query,
    searchedAt: row.createdAt.toISOString(),
  });
}
