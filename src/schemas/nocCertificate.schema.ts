import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";
import {
  contentModeSchema,
  customContentSchema,
  hasCustomContent,
  isCustomMode,
} from "./documentContent.schema";

export const purposeOfVisitSchema = z.enum([
  "TOURISM",
  "BUSINESS",
  "EDUCATION",
  "MEDICAL",
  "FAMILY",
  "OTHER",
]);

const nocCertificateObjectSchema = z.object({
  company: z.string().min(1).max(200),
  employeeName: z.string().max(200).optional().nullable(),
  salutation: z.enum(["Mr.", "Ms.", "Mrs.", "Dr."]).optional().nullable(),
  designation: z.string().max(200).optional().nullable(),
  joiningDate: optionalIsoDate,
  annualPackage: z.number().nonnegative().optional().nullable(),
  destinationCountry: z.string().max(200).optional().nullable(),
  purposeOfVisit: purposeOfVisitSchema.optional().nullable(),
  travelDurationDays: z.number().int().positive().optional().nullable(),
  certificateDate: optionalIsoDate,
  issuerName: z.string().max(200).optional().nullable(),
  issuerDesignation: z.string().max(200).optional().nullable(),
  issuerDepartment: z.string().max(200).optional().nullable(),
  contentMode: contentModeSchema,
  customContent: customContentSchema,
  employeeRefId: employeeRefIdField,
});

export const createNocCertificateSchema = nocCertificateObjectSchema
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
    if (!data.destinationCountry?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination country is required",
        path: ["destinationCountry"],
      });
    }
    if (!data.purposeOfVisit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Purpose of visit is required",
        path: ["purposeOfVisit"],
      });
    }
    if (!data.travelDurationDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Travel duration is required",
        path: ["travelDurationDays"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    employeeName: data.employeeName?.trim() || "Custom Document",
    destinationCountry: data.destinationCountry?.trim() || "—",
    purposeOfVisit: data.purposeOfVisit ?? "OTHER",
    travelDurationDays: data.travelDurationDays ?? 1,
    employeeRefId: data.employeeRefId ?? undefined,
  }));

export const updateNocCertificateSchema = nocCertificateObjectSchema
  .partial()
  .extend({
    restore: restoreField,
  });

export type CreateNocCertificateInput = z.infer<
  typeof createNocCertificateSchema
>;
export type UpdateNocCertificateInput = z.infer<
  typeof updateNocCertificateSchema
>;
