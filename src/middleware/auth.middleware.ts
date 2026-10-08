import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role, Workspace } from "@prisma/client";
import prisma from "../config/db";
import { isTokenRevoked } from "../utils/tokenBlacklist";
import { resolveWorkspace, runWithContext } from "../utils/requestContext";

export interface AuthRequest extends Request {
  admin?: { id: number; email: string; role: Role };
  /** Workspace this request is scoped to (fixed for ADMIN/HR, chosen by SUPER_ADMIN). */
  workspace?: Workspace;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfiguration: JWT_SECRET not set" });
  }

  let payload: { id: number; email: string; exp?: number };
  try {
    payload = jwt.verify(token, secret) as { id: number; email: string; exp?: number };
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (await isTokenRevoked(token)) {
    return res.status(401).json({ error: "Token has been revoked. Please log in again." });
  }

  // Role is read from the DB (not the token) so role changes / removed users apply immediately.
  const user = await prisma.admin.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return res.status(401).json({ error: "User no longer exists. Please log in again." });
  }

  const requested = req.header("x-workspace");
  const workspace = resolveWorkspace(user.role, requested);
  if (!workspace) {
    return res.status(400).json({ error: `Unknown workspace "${requested}".` });
  }

  req.admin = user;
  req.workspace = workspace;
  runWithContext({ userId: user.id, role: user.role, workspace }, () => next());
}

/** Allow only requests scoped to the given workspace (HR-only documents). Use after requireAuth. */
export function requireWorkspace(workspace: Workspace) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.workspace !== workspace) {
      return res.status(403).json({ error: "This section is not available in your workspace." });
    }
    next();
  };
}

/** Allow only the given roles. Use after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ error: "You do not have access to this section." });
    }
    next();
  };
}
