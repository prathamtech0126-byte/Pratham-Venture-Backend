import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";
import {
  contentModeSchema,
  customContentSchema,
  hasCustomContent,
  isCustomMode,
} from "./documentContent.schema";

const optionalText = (max: number) => z.string().max(max).optional().nullable();

const engagementLetterObjectSchema = z.object({
  company: z.string().min(1).max(200),
  letterDate: optionalIsoDate,
  employeeName: optionalText(200),
  employeeAddress: optionalText(1000),
  designation: optionalText(200),
  department: optionalText(200),
  reportingTo: optionalText(200),
  workLocation: optionalText(300),
  joiningDate: optionalIsoDate,
  annualCtc: z.number().nonnegative().optional().nullable(),
  reportingTime: optionalText(100),
  trainingDays: z.number().int().min(0).max(365).optional().nullable(),
  probationDays: z.number().int().min(0).max(730).optional().nullable(),
  signatoryName: optionalText(200),
  signatoryDesignation: optionalText(200),
  signatoryCompany: optionalText(200),
  contentMode: contentModeSchema,
  customContent: customContentSchema,
  employeeRefId: employeeRefIdField,
});

export const createEngagementLetterSchema = engagementLetterObjectSchema
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
    if (!data.designation?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Designation is required",
        path: ["designation"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    employeeName: data.employeeName?.trim() || "Custom Document",
    designation: data.designation?.trim() || "—",
    employeeRefId: data.employeeRefId ?? undefined,
  }));

export const updateEngagementLetterSchema = engagementLetterObjectSchema.partial().extend({
  restore: restoreField,
});

export type CreateEngagementLetterInput = z.infer<typeof createEngagementLetterSchema>;
export type UpdateEngagementLetterInput = z.infer<typeof updateEngagementLetterSchema>;
