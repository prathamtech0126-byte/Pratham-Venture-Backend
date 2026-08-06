import { Prisma } from "@prisma/client";
import { SoftDeleteStatus, softDeleteWhere } from "./softDelete";

export const SEARCH_TYPES = [
  "employee",
  "offer_letter",
  "salary_slip",
  "noc_certificate",
  "employment_verification_letter",
  "job_duty_certificate",
  "appointment_letter",
  "promotion_letter",
  "submission",
] as const;

export type SearchType = (typeof SEARCH_TYPES)[number];

export type SearchResultItem = {
  id: string;
  type: SearchType;
  title: string;
  subtitle?: string;
  meta?: string;
  url: string;
  status?: string;
  score?: number;
};

export type SearchAction = {
  label: string;
  url: string;
};

const TYPE_LABELS: Record<SearchType, string> = {
  employee: "Employees",
  offer_letter: "Offer Letters",
  salary_slip: "Salary Slips",
  noc_certificate: "NOC Certificates",
  employment_verification_letter: "Employment Verification",
  job_duty_certificate: "Job Duty Certificates",
  appointment_letter: "Appointment Letters",
  promotion_letter: "Promotion Letters",
  submission: "Submissions",
};

const TYPE_KEYWORDS: Partial<Record<SearchType, string[]>> = {
  employee: ["employee", "emp"],
  offer_letter: ["offer"],
  salary_slip: ["salary", "slip", "pay"],
  noc_certificate: ["noc", "visa"],
  employment_verification_letter: ["verification"],
  job_duty_certificate: ["duty"],
  appointment_letter: ["appointment"],
  promotion_letter: ["promotion", "promote"],
  submission: ["contact", "inquiry", "submission", "message"],
};

const MONTH_ALIASES: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

export function parseSearchTypes(raw: string | undefined): SearchType[] | null {
  if (!raw?.trim()) return [...SEARCH_TYPES];
  const parsed = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  if (parsed.length === 0) return [...SEARCH_TYPES];
  for (const type of parsed) {
    if (!SEARCH_TYPES.includes(type as SearchType)) return null;
  }
  return parsed as SearchType[];
}

export function parseSearchTerms(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length >= 2);
}

export function resolveRecordStatus(
  query: string,
  statusParam: SoftDeleteStatus | null
): SoftDeleteStatus | null {
  if (statusParam) return statusParam;
  if (/\binactive\b/i.test(query)) return "all";
  return "active";
}

function insensitiveContains(term: string): Prisma.StringFilter {
  return { contains: term, mode: "insensitive" };
}

export function buildTextOrWhere(
  terms: string[],
  fieldGetters: Array<(term: string) => Prisma.Enumerable<Record<string, unknown>>>
): { OR: Record<string, unknown>[] } {
  const OR = terms.flatMap((term) =>
    fieldGetters.flatMap((getter) => {
      const clause = getter(term);
      return Array.isArray(clause) ? clause : [clause];
    })
  );
  return { OR };
}

export function extractMonthPatterns(query: string): string[] {
  const lower = query.toLowerCase();
  const patterns = new Set<string>();
  const yearMatch = query.match(/\b(20\d{2})\b/);
  const year = yearMatch?.[1];

  for (const [alias, monthNum] of Object.entries(MONTH_ALIASES)) {
    if (lower.includes(alias) && year) {
      patterns.add(`${year}-${monthNum}`);
    }
  }

  const isoMonth = query.match(/\b(20\d{2})[-/](\d{1,2})\b/);
  if (isoMonth) {
    patterns.add(`${isoMonth[1]}-${isoMonth[2].padStart(2, "0")}`);
  }

  if (year) patterns.add(year);
  return [...patterns];
}

export function formatMonthLabel(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return month;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function formatSubmissionDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function capitalizeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function scoreText(text: string | null | undefined, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (lower === term) score += 30;
    else if (lower.startsWith(term)) score += 20;
    else if (lower.includes(term)) score += 10;
  }
  return score;
}

export function scoreResult(
  item: SearchResultItem,
  terms: string[],
  query: string
): number {
  let score = 0;
  score += scoreText(item.title, terms);
  score += scoreText(item.subtitle, terms);
  score += scoreText(item.meta, terms);

  const keywords = TYPE_KEYWORDS[item.type];
  if (keywords?.some((keyword) => query.includes(keyword))) {
    score += 15;
  }

  if (item.status === "active" || item.status === "NEW") score += 50;
  else if (item.status === "READ") score += 40;
  else if (item.status === "REPLIED") score += 35;

  return score;
}

export function sortResults(results: SearchResultItem[], terms: string[], query: string): SearchResultItem[] {
  return results
    .map((item) => ({
      ...item,
      score: scoreResult(item, terms, query),
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function groupResults(results: SearchResultItem[]) {
  const grouped = new Map<SearchType, SearchResultItem[]>();
  for (const type of SEARCH_TYPES) grouped.set(type, []);

  for (const item of results) {
    grouped.get(item.type)?.push(item);
  }

  return SEARCH_TYPES.flatMap((type) => {
    const typeResults = grouped.get(type) ?? [];
    if (typeResults.length === 0) return [];
    return [{ type, label: TYPE_LABELS[type], results: typeResults }];
  });
}

export function buildEmployeeActions(
  employees: Array<{ id: number; name: string }>,
  query: string
): SearchAction[] {
  const lower = query.toLowerCase();
  const actions: SearchAction[] = [];
  const top = employees.slice(0, 3);

  for (const employee of top) {
    if (/\b(salary|slip|pay)\b/.test(lower)) {
      actions.push({
        label: `Create salary slip for ${employee.name}`,
        url: `/salary-slip/create?employeeRefId=${employee.id}`,
      });
    }
    if (/\boffer\b/.test(lower)) {
      actions.push({
        label: `Create offer letter for ${employee.name}`,
        url: `/offer-letter/create?employeeRefId=${employee.id}`,
      });
    }
    if (/\b(noc|visa)\b/.test(lower)) {
      actions.push({
        label: `Create NOC certificate for ${employee.name}`,
        url: `/noc-certificate/create?employeeRefId=${employee.id}`,
      });
    }
    if (/\bverification\b/.test(lower)) {
      actions.push({
        label: `Create employment verification for ${employee.name}`,
        url: `/employment-verification-letter/create?employeeRefId=${employee.id}`,
      });
    }
    if (/\bduty\b/.test(lower)) {
      actions.push({
        label: `Create job duty certificate for ${employee.name}`,
        url: `/job-duty-certificate/create?employeeRefId=${employee.id}`,
      });
    }
    if (/\bappointment\b/.test(lower)) {
      actions.push({
        label: `Create appointment letter for ${employee.name}`,
        url: `/appointment-letter/create?employeeRefId=${employee.id}`,
      });
    }
    if (/\bpromotion\b/.test(lower)) {
      actions.push({
        label: `Create promotion letter for ${employee.name}`,
        url: `/promotion-letter/create?employeeRefId=${employee.id}`,
      });
    }
  }

  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.url)) return false;
    seen.add(action.url);
    return true;
  });
}

export function recordStatusWhere(status: SoftDeleteStatus) {
  return softDeleteWhere(status);
}
