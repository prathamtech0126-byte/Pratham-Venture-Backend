import { createHash } from "crypto";
import prisma from "../config/db";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Add a JWT to the blacklist until its natural expiry. */
export async function revokeToken(token: string, expiresAt: Date): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.tokenBlacklist.upsert({
    where: { tokenHash },
    create: { tokenHash, expiresAt },
    update: { expiresAt },
  });

  // Opportunistic cleanup of already-expired entries
  await prisma.tokenBlacklist.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

/** True if this token was logged out / revoked and has not yet expired. */
export async function isTokenRevoked(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const row = await prisma.tokenBlacklist.findUnique({ where: { tokenHash } });
  if (!row) return false;
  if (row.expiresAt <= new Date()) {
    await prisma.tokenBlacklist.delete({ where: { tokenHash } }).catch(() => undefined);
    return false;
  }
  return true;
}
