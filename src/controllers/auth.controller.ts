import { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { loginSchema } from "../schemas/auth.schema";
import { AuthRequest } from "../middleware/auth.middleware";
import { revokeToken } from "../utils/tokenBlacklist";

export async function login(req: AuthRequest, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfiguration: JWT_SECRET not set" });
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || "1d") as jwt.SignOptions["expiresIn"];
  const token = jwt.sign({ id: admin.id, email: admin.email }, secret, { expiresIn });

  return res.json({ token, admin: { id: admin.id, email: admin.email } });
}

// POST /api/auth/logout — revoke current JWT server-side until it expires
export async function logout(req: AuthRequest, res: Response) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfiguration: JWT_SECRET not set" });
  }

  try {
    const payload = jwt.verify(token, secret) as { exp?: number };
    const expiresAt = payload.exp
      ? new Date(payload.exp * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await revokeToken(token, expiresAt);
    return res.json({ success: true, message: "Logged out successfully" });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
