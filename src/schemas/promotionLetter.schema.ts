import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";
import {
  contentModeSchema,
  customContentSchema,
  hasCustomContent,
  isCustomMode,
} from "./documentContent.schema";

const optionalText = z.string().max(500).optional().nullable();
const optionalLongText = z.string().max(8000).optional().nullable();

const promotionLetterObjectSchema = z.object({
  company: z.string().min(1).max(200),
  employeeName: z.string().max(200).optional().nullable(),
  recipientAddress: optionalText,
  letterDate: optionalIsoDate,
  previousDesignation: z.string().max(200).optional().nullable(),
  newDesignation: z.string().max(200).optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  effectiveDate: optionalIsoDate,
  monthlySalary: z.number().nonnegative().optional().nullable(),
  previousRoleStartDate: optionalIsoDate,
  performanceHighlights: optionalLongText,
  newResponsibilities: optionalLongText,
  additionalNotes: optionalLongText,
  signatoryName: z.string().max(200).optional().nullable(),
  signatoryDesignation: z.string().max(200).optional().nullable(),
  contentMode: contentModeSchema,
  customContent: customContentSchema,
  employeeRefId: employeeRefIdField,
});

export const createPromotionLetterSchema = promotionLetterObjectSchema
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
    if (!data.newDesignation?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New designation is required",
        path: ["newDesignation"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    employeeName: data.employeeName?.trim() || "Custom Document",
    newDesignation: data.newDesignation?.trim() || "—",
    employeeRefId: data.employeeRefId ?? undefined,
  }));

export const updatePromotionLetterSchema = promotionLetterObjectSchema
  .partial()
  .extend({
    restore: restoreField,
  });

export type CreatePromotionLetterInput = z.infer<
  typeof createPromotionLetterSchema
>;
export type UpdatePromotionLetterInput = z.infer<
  typeof updatePromotionLetterSchema
>;
