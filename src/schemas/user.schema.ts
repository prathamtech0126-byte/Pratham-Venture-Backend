import { z } from "zod";
import { Role } from "@prisma/client";

const password = z.string().min(8, "Password must be at least 8 characters").max(128);

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password,
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z
  .object({
    role: z.nativeEnum(Role).optional(),
    password: password.optional(),
  })
  .refine((v) => v.role !== undefined || v.password !== undefined, {
    message: "Provide role and/or password",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
