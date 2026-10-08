import { Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/db";
import { AuthRequest } from "../middleware/auth.middleware";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema";
import { parseId } from "../utils/parseId";

const userSelect = { id: true, email: true, role: true, createdAt: true } as const;

// GET /api/users
export async function listUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.admin.findMany({
    select: userSelect,
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });
  return res.json({ data: users });
}

// POST /api/users  { email, password, role }
export async function createUser(req: AuthRequest, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { email, password, role } = parsed.data;
  const existing = await prisma.admin.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    return res.status(409).json({ error: "A user with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.admin.create({
    data: { email, passwordHash, role },
    select: userSelect,
  });
  return res.status(201).json(user);
}

// PATCH /api/users/:id  { role?, password? }
export async function updateUser(req: AuthRequest, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { role, password } = parsed.data;
  // Prevents a super admin from locking everyone out of user management.
  if (id === req.admin?.id && role !== undefined && role !== req.admin.role) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }

  const existing = await prisma.admin.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "User not found" });
  }

  const user = await prisma.admin.update({
    where: { id },
    data: {
      ...(role !== undefined ? { role } : {}),
      ...(password !== undefined ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
    select: userSelect,
  });
  return res.json(user);
}

// DELETE /api/users/:id  (hard delete — the user's sessions stop working immediately)
export async function deleteUser(req: AuthRequest, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid id" });
  }
  if (id === req.admin?.id) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  const existing = await prisma.admin.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "User not found" });
  }

  await prisma.admin.delete({ where: { id } });
  return res.json({ success: true });
}
