import { z } from "zod";
import { restoreField } from "./common";

export const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  restore: restoreField,
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
