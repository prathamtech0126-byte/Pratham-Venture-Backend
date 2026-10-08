import { z } from "zod";
import { employeeRefIdField, money, monthSchema, optionalIsoDate, restoreField } from "./common";

const optionalText = z.string().max(200).optional().nullable();

/** Extra employee / leave details printed by the "Pratham format" payslip. */
const prathamFormatFields = {
  fatherName: optionalText,
  gender: z.string().max(20).optional().nullable(),
  dateOfBirth: optionalIsoDate,
  pan: z.string().max(20).optional().nullable(),
  aadhaar: z.string().max(20).optional().nullable(),
  shift: z.string().max(50).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  weekOffs: z.number().int().nonnegative().optional().nullable(),
  plBalance: z.number().optional().nullable(),
  clBalance: z.number().optional().nullable(),
  slBalance: z.number().optional().nullable(),
  cwBalance: z.number().optional().nullable(),
};

export const createSalarySlipSchema = z.object({
  company: z.string().min(1).max(200),
  employeeName: z.string().min(1).max(200),
  employeeId: z.string().max(50).optional().nullable(),
  employeeRefId: employeeRefIdField,
  designation: z.string().max(200).optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  month: monthSchema,
  basic: money,
  hra: money.optional().default(0),
  conveyance: money.optional().default(0),
  special: money.optional().default(0),
  pf: money.optional().default(0),
  profTax: money.optional().default(0),
  tds: money.optional().default(0),
  otherDeduction: money.optional().default(0),
  workingDays: z.number().int().nonnegative().optional().default(0),
  leaves: z.number().int().nonnegative().optional().default(0),
  lopDays: z.number().int().nonnegative().optional().default(0),
  paidDays: z.number().int().nonnegative().optional().default(0),
  uan: z.string().max(50).optional().nullable(),
  pfNumber: z.string().max(50).optional().nullable(),
  esiNumber: z.string().max(50).optional().nullable(),
  bankName: optionalText,
  bankAccountNo: z.string().max(50).optional().nullable(),
  ...prathamFormatFields,
});

export const updateSalarySlipSchema = z.object({
  company: z.string().min(1).max(200).optional(),
  employeeName: z.string().min(1).max(200).optional(),
  employeeId: z.string().max(50).optional().nullable(),
  employeeRefId: employeeRefIdField,
  designation: z.string().max(200).optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  month: monthSchema.optional(),
  basic: money.optional(),
  hra: money.optional(),
  conveyance: money.optional(),
  special: money.optional(),
  pf: money.optional(),
  profTax: money.optional(),
  tds: money.optional(),
  otherDeduction: money.optional(),
  workingDays: z.number().int().nonnegative().optional(),
  leaves: z.number().int().nonnegative().optional(),
  lopDays: z.number().int().nonnegative().optional(),
  paidDays: z.number().int().nonnegative().optional(),
  uan: z.string().max(50).optional().nullable(),
  pfNumber: z.string().max(50).optional().nullable(),
  esiNumber: z.string().max(50).optional().nullable(),
  bankName: optionalText,
  bankAccountNo: z.string().max(50).optional().nullable(),
  ...prathamFormatFields,
  restore: restoreField,
});

export type CreateSalarySlipInput = z.infer<typeof createSalarySlipSchema>;
export type UpdateSalarySlipInput = z.infer<typeof updateSalarySlipSchema>;
