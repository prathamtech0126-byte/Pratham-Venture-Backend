import { z } from "zod";
import { restoreField } from "./common";

export const createDesignationSchema = z.object({
  companyId: z.number().int().positive(),
  name: z.string().min(1).max(200),
});

export const updateDesignationSchema = z.object({
  companyId: z.number().int().positive().optional(),
  name: z.string().min(1).max(200).optional(),
  restore: restoreField,
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
