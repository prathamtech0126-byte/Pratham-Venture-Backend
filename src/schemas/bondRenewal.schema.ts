import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";

const optionalText = (max: number) => z.string().max(max).optional().nullable();

const bondRenewalObjectSchema = z.object({
  company: z.string().min(1).max(200),
  letterDate: optionalIsoDate,
  employeeName: z.string().max(200).optional().nullable(),
  employeeAddress: optionalText(1000),
  designation: z.string().max(200).optional().nullable(),
  department: optionalText(200),
  workLocation: optionalText(300),
  effectiveDate: optionalIsoDate,
  compensation: optionalText(300),
  bondDuration: optionalText(100),
  reportingTo: optionalText(300),
  scheduleA: z.string().max(200_000).optional().nullable(),
  scheduleB: z.string().max(200_000).optional().nullable(),
  includeSignature: z.boolean().optional(),
  employeeRefId: employeeRefIdField,
});

export const createBondRenewalSchema = bondRenewalObjectSchema
  .superRefine((data, ctx) => {
    if (!data.employeeName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Employee name is required", path: ["employeeName"] });
    }
    if (!data.designation?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Designation is required", path: ["designation"] });
    }
  })
  .transform((data) => ({
    ...data,
    employeeName: data.employeeName!.trim(),
    designation: data.designation!.trim(),
    employeeRefId: data.employeeRefId ?? undefined,
  }));

export const updateBondRenewalSchema = bondRenewalObjectSchema.partial().extend({
  restore: restoreField,
});

export type CreateBondRenewalInput = z.infer<typeof createBondRenewalSchema>;
export type UpdateBondRenewalInput = z.infer<typeof updateBondRenewalSchema>;
