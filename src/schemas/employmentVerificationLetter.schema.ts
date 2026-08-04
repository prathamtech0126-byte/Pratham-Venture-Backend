import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";
import {
  contentModeSchema,
  customContentSchema,
  hasCustomContent,
  isCustomMode,
} from "./documentContent.schema";

export const employmentStatusSchema = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
]);

const optionalText = z.string().max(500).optional().nullable();

const employmentVerificationLetterObjectSchema = z.object({
  company: z.string().min(1).max(200),
  employeeName: z.string().max(200).optional().nullable(),
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
  contentMode: contentModeSchema,
  customContent: customContentSchema,
  employeeRefId: employeeRefIdField,
});

export const createEmploymentVerificationLetterSchema =
  employmentVerificationLetterObjectSchema
    .superRefine((data, ctx) => {
      if (isCustomMode(data.contentMode)) {
        if (!hasCustomContent(data.customContent)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Custom content is required in custom mode",
            path: ["customContent"],
          });
        }
        return;
      }
      if (!data.employeeName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Employee name is required",
          path: ["employeeName"],
        });
      }
    })
    .transform((data) => ({
      ...data,
      employeeName: data.employeeName?.trim() || "Custom Document",
      employeeRefId: data.employeeRefId ?? undefined,
    }));

export const updateEmploymentVerificationLetterSchema =
  employmentVerificationLetterObjectSchema.partial().extend({
    restore: restoreField,
  });

export type CreateEmploymentVerificationLetterInput = z.infer<
  typeof createEmploymentVerificationLetterSchema
>;
export type UpdateEmploymentVerificationLetterInput = z.infer<
  typeof updateEmploymentVerificationLetterSchema
>;
