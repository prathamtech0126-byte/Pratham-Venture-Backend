import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";

export const salaryPaymentFrequencySchema = z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "ANNUALLY"]);

const optionalText = z.string().max(500).optional().nullable();
const optionalLongText = z.string().max(5000).optional().nullable();

export const createAppointmentLetterSchema = z.object({
  company: z.string().min(1).max(200),
  companyWebsite: z.string().max(200).optional().nullable(),
  companyEmail: z.string().email().max(200).optional().nullable(),
  companyPhone: z.string().max(50).optional().nullable(),
  letterDate: optionalIsoDate,
  recipientName: z.string().min(1).max(200),
  recipientAddress: optionalText,
  jobTitle: z.string().min(1).max(200),
  startDate: optionalIsoDate,
  jobResponsibilities: optionalLongText,
  salaryAmount: z.number().nonnegative().optional().nullable(),
  salaryPaymentFrequency: salaryPaymentFrequencySchema.optional().nullable(),
  salaryEffectiveDate: optionalIsoDate,
  signatoryName: z.string().max(200).optional().nullable(),
  employeeRefId: employeeRefIdField,
});

export const updateAppointmentLetterSchema = createAppointmentLetterSchema.partial().extend({
  restore: restoreField,
});

export type CreateAppointmentLetterInput = z.infer<typeof createAppointmentLetterSchema>;
export type UpdateAppointmentLetterInput = z.infer<typeof updateAppointmentLetterSchema>;
