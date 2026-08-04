import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";
import {
  contentModeSchema,
  customContentSchema,
  hasCustomContent,
  isCustomMode,
} from "./documentContent.schema";

const optionalLongText = z.string().max(5000).optional().nullable();

const jobDutyCertificateObjectSchema = z.object({
  company: z.string().min(1).max(200),
  employeeName: z.string().max(200).optional().nullable(),
  registrationNo: z.string().max(50).optional().nullable(),
  designation: z.string().max(200).optional().nullable(),
  employmentStartDate: optionalIsoDate,
  employmentEndDate: optionalIsoDate,
  workResponsibilities: optionalLongText,
  monthlyGrossSalary: z.number().nonnegative().optional().nullable(),
  performanceRemarks: optionalLongText,
  certificateDate: optionalIsoDate,
  authorizedSignatory: z.string().max(200).optional().nullable(),
  contentMode: contentModeSchema,
  customContent: customContentSchema,
  employeeRefId: employeeRefIdField,
});

export const createJobDutyCertificateSchema = jobDutyCertificateObjectSchema
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

export const updateJobDutyCertificateSchema = jobDutyCertificateObjectSchema
  .partial()
  .extend({
    restore: restoreField,
  });

export type CreateJobDutyCertificateInput = z.infer<
  typeof createJobDutyCertificateSchema
>;
export type UpdateJobDutyCertificateInput = z.infer<
  typeof updateJobDutyCertificateSchema
>;
