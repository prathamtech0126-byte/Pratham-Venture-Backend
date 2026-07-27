import { z } from "zod";
import { SubmissionStatus } from "@prisma/client";
import { restoreField } from "./common";

export const contactSchema = z.object({
  siteSlug: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(30).optional(),
  subject: z.string().max(300).optional(),
  message: z.string().min(1).max(5000),
});

export const updateSubmissionSchema = z
  .object({
    status: z.nativeEnum(SubmissionStatus).optional(),
    restore: restoreField,
  })
  .refine((d) => d.status !== undefined || d.restore === true, {
    message: "Provide status and/or restore: true",
  });

export type ContactInput = z.infer<typeof contactSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
