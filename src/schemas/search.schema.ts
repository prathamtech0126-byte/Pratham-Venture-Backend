import { z } from "zod";

export const saveRecentSearchSchema = z.object({
  query: z.string().trim().min(2, "Query must be at least 2 characters").max(200),
});

export type SaveRecentSearchInput = z.infer<typeof saveRecentSearchSchema>;
