import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { isTokenRevoked } from "../utils/tokenBlacklist";

export interface AuthRequest extends Request {
  admin?: { id: number; email: string };
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

  try {
    const payload = jwt.verify(token, secret) as { id: number; email: string; exp?: number };

    if (await isTokenRevoked(token)) {
      return res.status(401).json({ error: "Token has been revoked. Please log in again." });
    }

    req.admin = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
