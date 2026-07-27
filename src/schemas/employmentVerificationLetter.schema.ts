import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";

export const employmentStatusSchema = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]);

const optionalText = z.string().max(500).optional().nullable();

export const createEmploymentVerificationLetterSchema = z.object({
  company: z.string().min(1).max(200),
  employeeName: z.string().min(1).max(200),
  designation: z.string().max(200).optional().nullable(),
  employmentStatus: employmentStatusSchema.optional().nullable(),
  annualSalary: z.number().nonnegative().optional().nullable(),
  letterDate: optionalIsoDate,
  recipientName: z.string().max(200).optional().nullable(),
  recipientTitle: z.string().max(200).optional().nullable(),
  recipientOrganization: z.string().max(200).optional().nullable(),
  recipientAddress: optionalText,
  hrName: z.string().max(200).optional().nullable(),
  hrDesignation: z.string().max(200).optional().nullable(),
  hrOfficeAddress: optionalText,
  hrEmail: z.string().email().max(200).optional().nullable(),
  hrPhone: z.string().max(50).optional().nullable(),
  employeeRefId: employeeRefIdField,
});

export const updateEmploymentVerificationLetterSchema =
  createEmploymentVerificationLetterSchema.partial().extend({
    restore: restoreField,
  });

export type CreateEmploymentVerificationLetterInput = z.infer<
  typeof createEmploymentVerificationLetterSchema
>;
export type UpdateEmploymentVerificationLetterInput = z.infer<
  typeof updateEmploymentVerificationLetterSchema
>;
