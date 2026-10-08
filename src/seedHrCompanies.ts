/**
 * HR workspace companies — one per letterhead — each with the full set of designations + JDs.
 * HR picks the letterhead by picking the company; names must match the keywords in
 * frontend src/lib/companyBrand.ts.
 *
 *   npm run seed:hr     (also runs as part of `npm run seed`)
 *
 * Safe to re-run: never overwrites a JD HR has edited and never restores a designation HR deleted.
 */
import { Workspace } from "@prisma/client";
import prisma from "./config/db";
import jobDescriptions from "./data/hrJobDescriptions.json";

export const HR_COMPANIES = [
  "Pratham International",
  "Pratham International (Old Letterhead)",
  "Pratham Tours",
  "Pratham Trips Pvt. Ltd.",
  "Parallax Crossfly Easyvisa Pvt. Ltd.",
  "Parallax Crossfly Easyvisa Pvt. Ltd. (HR Letterhead)",
];

interface JobDescriptionSeed {
  name: string;
  sourceFile: string;
  jobDescription: string;
  jobSummary: string;
}

export async function seedHrCompanies(): Promise<void> {
  let created = 0;
  let filled = 0;

  for (const companyName of HR_COMPANIES) {
    const company = await prisma.company.upsert({
      where: { workspace_name: { workspace: Workspace.HR, name: companyName } },
      update: { deletedAt: null },
      create: { name: companyName, workspace: Workspace.HR },
    });

    for (const jd of jobDescriptions as JobDescriptionSeed[]) {
      const existing = await prisma.designation.findFirst({
        where: { companyId: company.id, name: { equals: jd.name, mode: "insensitive" } },
      });

      if (!existing) {
        await prisma.designation.create({
          data: {
            companyId: company.id,
            name: jd.name,
            jobDescription: jd.jobDescription,
            jobSummary: jd.jobSummary,
            workspace: Workspace.HR,
          },
        });
        created += 1;
      } else if (!existing.deletedAt && (!existing.jobDescription || !existing.jobSummary)) {
        await prisma.designation.update({
          where: { id: existing.id },
          data: {
            jobDescription: existing.jobDescription ?? jd.jobDescription,
            jobSummary: existing.jobSummary ?? jd.jobSummary,
          },
        });
        filled += 1;
      }
    }
  }

  console.log(
    `Seeded ${HR_COMPANIES.length} HR companies; ${created} designations created, ${filled} JDs filled ` +
      `(${jobDescriptions.length} JDs per company).`
  );
}

if (require.main === module) {
  seedHrCompanies()
    .catch((e: unknown) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
