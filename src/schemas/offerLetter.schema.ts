import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";

export const createOfferLetterSchema = z.object({
  company: z.string().min(1).max(200),
  candidateName: z.string().min(1).max(200),
  position: z.string().min(1).max(200),
  department: z.string().max(200).optional().nullable(),
  annualCtc: z.number().nonnegative().optional().nullable(),
  joiningDate: optionalIsoDate,
  workLocation: z.string().max(300).optional().nullable(),
  letterDate: optionalIsoDate,
  hrName: z.string().max(200).optional().nullable(),
  hrDesignation: z.string().max(200).optional().nullable(),
  employeeRefId: employeeRefIdField,
});

export const updateOfferLetterSchema = createOfferLetterSchema.partial().extend({
  restore: restoreField,
});

export type CreateOfferLetterInput = z.infer<typeof createOfferLetterSchema>;
export type UpdateOfferLetterInput = z.infer<typeof updateOfferLetterSchema>;
