import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";

const optionalLongText = z.string().max(5000).optional().nullable();

export const createJobDutyCertificateSchema = z.object({
  company: z.string().min(1).max(200),
  employeeName: z.string().min(1).max(200),
  registrationNo: z.string().max(50).optional().nullable(),
  designation: z.string().max(200).optional().nullable(),
  employmentStartDate: optionalIsoDate,
  employmentEndDate: optionalIsoDate,
  workResponsibilities: optionalLongText,
  monthlyGrossSalary: z.number().nonnegative().optional().nullable(),
  performanceRemarks: optionalLongText,
  certificateDate: optionalIsoDate,
  authorizedSignatory: z.string().max(200).optional().nullable(),
  employeeRefId: employeeRefIdField,
});

export const updateJobDutyCertificateSchema = createJobDutyCertificateSchema.partial().extend({
  restore: restoreField,
});

export type CreateJobDutyCertificateInput = z.infer<typeof createJobDutyCertificateSchema>;
export type UpdateJobDutyCertificateInput = z.infer<typeof updateJobDutyCertificateSchema>;
