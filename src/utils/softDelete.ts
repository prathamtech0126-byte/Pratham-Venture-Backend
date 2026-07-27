import { Request } from "express";

export type SoftDeleteStatus = "active" | "inactive" | "all";

/**
 * Parse soft-delete filter from query.
 * Default key: `status` (offer letters / salary slips).
 * Submissions use `recordStatus` because `status` is NEW|READ|REPLIED.
 */
export function parseSoftDeleteStatus(
  req: Request,
  queryKey: string = "status"
): SoftDeleteStatus | null {
  const raw =
    typeof req.query[queryKey] === "string"
      ? String(req.query[queryKey]).trim().toLowerCase()
      : "active";
  if (raw === "active" || raw === "inactive" || raw === "all") return raw;
  return null;
}

/** Prisma where fragment for soft-delete status. */
export function softDeleteWhere(
  status: SoftDeleteStatus
): { deletedAt: null } | { deletedAt: { not: null } } | Record<string, never> {
  if (status === "active") return { deletedAt: null };
  if (status === "inactive") return { deletedAt: { not: null } };
  return {};
}

export function withStatus<T extends { deletedAt: Date | null }>(
  row: T
): T & { status: "active" | "inactive" } {
  return {
    ...row,
    status: row.deletedAt ? "inactive" : "active",
  };
}

/** For submissions — keeps enum `status` (NEW/READ/REPLIED), adds `recordStatus`. */
export function withRecordStatus<T extends { deletedAt: Date | null }>(
  row: T
): T & { recordStatus: "active" | "inactive" } {
  return {
    ...row,
    recordStatus: row.deletedAt ? "inactive" : "active",
  };
}
