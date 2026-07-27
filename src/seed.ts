import path from "path";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import prisma from "./config/db";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sites = [
  {
    name: "Inkline Digital Solutions",
    slug: "inkline-digital-solutions",
    domain: "inklinedigitalsolutions.in",
  },
  {
    name: "Prarambh Manufacturing",
    slug: "prarambh-manufacturing",
    domain: "prarambhmanufacturing.in",
  },
  {
    name: "Aarogya Path Wellness",
    slug: "aarogya-path-wellness",
    domain: "aarogyapathhub.in",
  },
  {
    name: "Dear Stranger Café",
    slug: "dear-stranger-cafe",
    domain: "dearstrangercafe.in",
  },
];

const companiesWithDesignations: { name: string; designations: string[] }[] = [
  {
    name: "Inkline Digital Solutions",
    designations: [
      "Software Developer (Web, Mobile, Backend)",
      "Front-End Developer / UI Developer",
      "Software Tester / QA Engineer",
      "UI/UX Designer",
      "Data Analyst",
      "Business Analyst",
      "Project Manager / Scrum Master",
      "Digital Marketing Executive",
      "SEO Specialist",
      "Social Media Manager",
      "Content Writer / Copywriter",
      "Graphic Designer",
      "Video Editor",
      "IT Support / Helpdesk Executive",
      "Network Administrator",
      "HR Executive (Recruitment & Operations)",
      "Accounts Executive",
      "Sales & Business Development Executive",
      "Office Administrator / Receptionist",
    ],
  },
  {
    name: "Prarambh Manufacturing Pvt. Ltd.",
    designations: [
      "Plant Manager / Unit Head",
      "Production Supervisor",
      "Machine Operator",
      "Assembly Line Worker / Technician",
      "Quality Control Inspector",
      "Quality Assurance Executive",
      "Maintenance Technician (Electrical / Mechanical)",
      "Store Keeper / Inventory Executive",
      "Warehouse Staff / Material Handler",
      "Procurement / Purchase Officer",
      "Safety Officer (EHS)",
      "Logistics & Dispatch Coordinator",
      "Production Planning Executive",
      "Accounts & Billing Executive",
      "HR & Payroll Executive",
      "Security Staff",
      "Housekeeping Staff",
    ],
  },
  {
    name: "Aarogya Path Wellness Center",
    designations: [
      "General Physician (Consultant)",
      "Pathologist (Consultant / Visiting)",
      "Lab Technician",
      "Radiology / X-Ray Technician",
      "Staff Nurse",
      "Pharmacist",
      "Physiotherapist",
      "Dietician / Nutritionist",
      "Front Desk Executive / Receptionist",
      "Medical Records Executive",
      "Phlebotomist (Sample Collection)",
      "Health Counsellor",
      "Billing & Insurance Executive",
      "Center Manager / Operations Executive",
      "Housekeeping & Support Staff",
      "Ambulance Driver / Field Sample Collector",
    ],
  },
  {
    name: "Dear Stranger Café",
    designations: [
      "Café Manager / Outlet Manager",
      "Head Chef / Kitchen Supervisor",
      "Commis Chef / Kitchen Staff",
      "Barista",
      "Baker / Pastry Assistant",
      "Waiter / Service Staff",
      "Cashier / Billing Executive",
      "Coworking Community Manager",
      "Front Desk / Membership Executive",
      "Event Coordinator",
      "Housekeeping Staff",
      "Purchase & Stores Executive",
      "Marketing & Social Media Executive",
      "Maintenance Staff",
      "Delivery Coordinator",
    ],
  },
];

async function seedCompaniesAndDesignations(): Promise<void> {
  let designationCount = 0;

  for (const entry of companiesWithDesignations) {
    const company = await prisma.company.upsert({
      where: { name: entry.name },
      update: { deletedAt: null },
      create: { name: entry.name },
    });

    for (const designationName of entry.designations) {
      const existing = await prisma.designation.findFirst({
        where: {
          companyId: company.id,
          name: { equals: designationName, mode: "insensitive" },
        },
      });

      if (existing) {
        if (existing.deletedAt) {
          await prisma.designation.update({
            where: { id: existing.id },
            data: { name: designationName, deletedAt: null },
          });
        }
      } else {
        await prisma.designation.create({
          data: { companyId: company.id, name: designationName },
        });
      }
      designationCount += 1;
    }
  }

  console.log(
    `Seeded ${companiesWithDesignations.length} companies and ${designationCount} designations.`
  );
}

async function main(): Promise<void> {
  for (const site of sites) {
    await prisma.site.upsert({
      where: { slug: site.slug },
      update: { name: site.name, domain: site.domain },
      create: site,
    });
  }
  console.log(`Seeded ${sites.length} sites.`);

  await seedCompaniesAndDesignations();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });
  console.log(`Seeded admin user: ${adminEmail}`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
