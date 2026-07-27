-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');

-- CreateTable
CREATE TABLE "EmploymentVerificationLetter" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "designation" TEXT,
    "employmentStatus" "EmploymentStatus",
    "annualSalary" DOUBLE PRECISION,
    "letterDate" TIMESTAMP(3),
    "recipientName" TEXT,
    "recipientTitle" TEXT,
    "recipientOrganization" TEXT,
    "recipientAddress" TEXT,
    "hrName" TEXT,
    "hrDesignation" TEXT,
    "hrOfficeAddress" TEXT,
    "hrEmail" TEXT,
    "hrPhone" TEXT,
    "employeeRefId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EmploymentVerificationLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmploymentVerificationLetter_employeeName_idx" ON "EmploymentVerificationLetter"("employeeName");

-- CreateIndex
CREATE INDEX "EmploymentVerificationLetter_recipientOrganization_idx" ON "EmploymentVerificationLetter"("recipientOrganization");

-- CreateIndex
CREATE INDEX "EmploymentVerificationLetter_deletedAt_idx" ON "EmploymentVerificationLetter"("deletedAt");

-- CreateIndex
CREATE INDEX "EmploymentVerificationLetter_employeeRefId_idx" ON "EmploymentVerificationLetter"("employeeRefId");

-- AddForeignKey
ALTER TABLE "EmploymentVerificationLetter" ADD CONSTRAINT "EmploymentVerificationLetter_employeeRefId_fkey" FOREIGN KEY ("employeeRefId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
