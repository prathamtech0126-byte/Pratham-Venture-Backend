-- CreateEnum
CREATE TYPE "PurposeOfVisit" AS ENUM ('TOURISM', 'STUDY', 'FAMILY_VISIT');

-- CreateTable
CREATE TABLE "NocCertificate" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "salutation" TEXT,
    "designation" TEXT,
    "joiningDate" TIMESTAMP(3),
    "annualPackage" DOUBLE PRECISION,
    "destinationCountry" TEXT NOT NULL,
    "purposeOfVisit" "PurposeOfVisit" NOT NULL,
    "travelDurationDays" INTEGER NOT NULL,
    "certificateDate" TIMESTAMP(3),
    "issuerName" TEXT,
    "issuerDesignation" TEXT,
    "issuerDepartment" TEXT,
    "employeeRefId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NocCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NocCertificate_employeeName_idx" ON "NocCertificate"("employeeName");

-- CreateIndex
CREATE INDEX "NocCertificate_destinationCountry_idx" ON "NocCertificate"("destinationCountry");

-- CreateIndex
CREATE INDEX "NocCertificate_deletedAt_idx" ON "NocCertificate"("deletedAt");

-- CreateIndex
CREATE INDEX "NocCertificate_employeeRefId_idx" ON "NocCertificate"("employeeRefId");

-- AddForeignKey
ALTER TABLE "NocCertificate" ADD CONSTRAINT "NocCertificate_employeeRefId_fkey" FOREIGN KEY ("employeeRefId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
