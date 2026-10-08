/**
 * Create or update a panel user.
 *
 *   npm run create-user -- <email> <password> <ADMIN|HR>
 *
 * Re-running for an existing email resets its password and role.
 */
import path from "path";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Role } from "@prisma/client";
import prisma from "./config/db";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main(): Promise<void> {
  const [email, password, roleArg] = process.argv.slice(2);
  const role = roleArg?.toUpperCase() as Role | undefined;

  if (!email || !password || !role || !Object.values(Role).includes(role)) {
    throw new Error(
      `Usage: npm run create-user -- <email> <password> <${Object.values(Role).join("|")}>`
    );
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.admin.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, role },
    create: { email: email.toLowerCase(), passwordHash, role },
  });

  console.log(`Saved ${user.role} user: ${user.email}`);
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
