import { z } from "zod";
import { optionalIsoDate, restoreField } from "./common";

export const createEmployeeSchema = z.object({
  company: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  employeeCode: z.string().max(50).optional().nullable(),
  email: z
    .union([z.string().email().max(320), z.literal(""), z.null()])
    .optional(),
  phone: z.string().max(30).optional().nullable(),
  designation: z.string().max(200).optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  workLocation: z.string().max(300).optional().nullable(),
  joiningDate: optionalIsoDate,
  annualCtc: z.number().nonnegative().optional().nullable(),
  uan: z.string().max(50).optional().nullable(),
  pfNumber: z.string().max(50).optional().nullable(),
  esiNumber: z.string().max(50).optional().nullable(),
  bankName: z.string().max(200).optional().nullable(),
  bankAccountNo: z.string().max(50).optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  restore: restoreField,
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
