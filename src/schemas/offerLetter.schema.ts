import { z } from "zod";
import { employeeRefIdField, optionalIsoDate, restoreField } from "./common";
import {
  contentModeSchema,
  customContentSchema,
  hasCustomContent,
  isCustomMode,
} from "./documentContent.schema";

const offerLetterObjectSchema = z.object({
  company: z.string().min(1).max(200),
  candidateName: z.string().max(200).optional().nullable(),
  position: z.string().max(200).optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  annualCtc: z.number().nonnegative().optional().nullable(),
  joiningDate: optionalIsoDate,
  workLocation: z.string().max(300).optional().nullable(),
  letterDate: optionalIsoDate,
  hrName: z.string().max(200).optional().nullable(),
  hrDesignation: z.string().max(200).optional().nullable(),
  // HR (Pratham International) format
  candidateAddress: z.string().max(1000).optional().nullable(),
  reportingTime: z.string().max(100).optional().nullable(),
  responsibilities: z.string().max(5000).optional().nullable(),
  trainingDays: z.number().int().min(0).max(365).optional().nullable(),
  probationDays: z.number().int().min(0).max(730).optional().nullable(),
  contactName: z.string().max(200).optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  contactEmail: z.string().max(200).optional().nullable(),
  letterCompanyName: z.string().max(200).optional().nullable(),
  contentMode: contentModeSchema,
  customContent: customContentSchema,
  employeeRefId: employeeRefIdField,
});

export const createOfferLetterSchema = offerLetterObjectSchema
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
    if (!data.candidateName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Candidate name is required",
        path: ["candidateName"],
      });
    }
    if (!data.position?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Position is required",
        path: ["position"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    candidateName: data.candidateName?.trim() || "Custom Document",
    position: data.position?.trim() || "—",
    employeeRefId: data.employeeRefId ?? undefined,
  }));

export const updateOfferLetterSchema = offerLetterObjectSchema.partial().extend({
  restore: restoreField,
});

export type CreateOfferLetterInput = z.infer<typeof createOfferLetterSchema>;
export type UpdateOfferLetterInput = z.infer<typeof updateOfferLetterSchema>;
