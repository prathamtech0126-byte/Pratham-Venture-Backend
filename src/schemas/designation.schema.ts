import { z } from "zod";
import { restoreField } from "./common";

/** HR workspace only — full JD (HTML) and the short offer-letter paragraph. */
const jobDescriptionFields = {
  jobDescription: z.string().max(200_000).optional().nullable(),
  jobSummary: z.string().max(5_000).optional().nullable(),
};

export const createDesignationSchema = z.object({
  companyId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  ...jobDescriptionFields,
});

export const updateDesignationSchema = z.object({
  companyId: z.number().int().positive().optional(),
  name: z.string().min(1).max(200).optional(),
  restore: restoreField,
  ...jobDescriptionFields,
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
