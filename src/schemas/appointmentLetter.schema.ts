import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";
import {
  contentModeSchema,
  customContentSchema,
  hasCustomContent,
  isCustomMode,
} from "./documentContent.schema";

export const salaryPaymentFrequencySchema = z.enum([
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "ANNUALLY",
]);

const optionalText = z.string().max(500).optional().nullable();
const optionalLongText = z.string().max(5000).optional().nullable();

const appointmentLetterObjectSchema = z.object({
  company: z.string().min(1).max(200),
  companyWebsite: z.string().max(200).optional().nullable(),
  companyEmail: z.string().email().max(200).optional().nullable(),
  companyPhone: z.string().max(50).optional().nullable(),
  letterDate: optionalIsoDate,
  recipientName: z.string().max(200).optional().nullable(),
  recipientAddress: optionalText,
  jobTitle: z.string().max(200).optional().nullable(),
  startDate: optionalIsoDate,
  jobResponsibilities: optionalLongText,
  /** HR: full JD snapshot (HTML) printed as an annexure */
  jobDescription: z.string().max(200_000).optional().nullable(),
  salaryAmount: z.number().nonnegative().optional().nullable(),
  salaryPaymentFrequency: salaryPaymentFrequencySchema.optional().nullable(),
  salaryEffectiveDate: optionalIsoDate,
  signatoryName: z.string().max(200).optional().nullable(),
  contentMode: contentModeSchema,
  customContent: customContentSchema,
  employeeRefId: employeeRefIdField,
});

export const createAppointmentLetterSchema = appointmentLetterObjectSchema
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
    if (!data.recipientName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recipient name is required",
        path: ["recipientName"],
      });
    }
    if (!data.jobTitle?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Job title is required",
        path: ["jobTitle"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    recipientName: data.recipientName?.trim() || "Custom Document",
    jobTitle: data.jobTitle?.trim() || "—",
    employeeRefId: data.employeeRefId ?? undefined,
  }));

export const updateAppointmentLetterSchema =
  appointmentLetterObjectSchema.partial().extend({
    restore: restoreField,
  });

export type CreateAppointmentLetterInput = z.infer<
  typeof createAppointmentLetterSchema
>;
export type UpdateAppointmentLetterInput = z.infer<
  typeof updateAppointmentLetterSchema
>;
