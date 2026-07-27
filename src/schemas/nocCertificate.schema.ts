import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";

export const purposeOfVisitSchema = z.enum([
  "TOURISM",
  "BUSINESS",
  "EDUCATION",
  "MEDICAL",
  "FAMILY",
  "OTHER",
]);

export const createNocCertificateSchema = z.object({
  company: z.string().min(1).max(200),
  employeeName: z.string().min(1).max(200),
  salutation: z.enum(["Mr.", "Ms.", "Mrs.", "Dr."]).optional().nullable(),
  designation: z.string().max(200).optional().nullable(),
  joiningDate: optionalIsoDate,
  annualPackage: z.number().nonnegative().optional().nullable(),
  destinationCountry: z.string().min(1).max(200),
  purposeOfVisit: purposeOfVisitSchema,
  travelDurationDays: z.number().int().positive(),
  certificateDate: optionalIsoDate,
  issuerName: z.string().max(200).optional().nullable(),
  issuerDesignation: z.string().max(200).optional().nullable(),
  issuerDepartment: z.string().max(200).optional().nullable(),
  employeeRefId: employeeRefIdField,
});

export const updateNocCertificateSchema = createNocCertificateSchema.partial().extend({
  restore: restoreField,
});

export type CreateNocCertificateInput = z.infer<typeof createNocCertificateSchema>;
export type UpdateNocCertificateInput = z.infer<typeof updateNocCertificateSchema>;
