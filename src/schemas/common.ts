import { z } from "zod";

/** ISO date string YYYY-MM-DD → Date */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date as YYYY-MM-DD")
  .transform((s) => new Date(s));

export const optionalIsoDate = z.union([isoDate, z.null()]).optional();

/** Calendar month YYYY-MM */
export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Expected month as YYYY-MM");

export const money = z.number().nonnegative();

export const restoreField = z.boolean().optional();

/**
 * Accepts number or numeric string from forms (e.g. "2" → 2).
 * Empty string / null / undefined → null.
 */
export const employeeRefIdField = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return null;
  if (typeof val === "string" && /^\d+$/.test(val.trim())) return Number(val.trim());
  return val;
}, z.number().int().positive().nullable().optional());
