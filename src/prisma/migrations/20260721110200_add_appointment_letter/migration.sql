-- CreateEnum
CREATE TYPE "SalaryPaymentFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUALLY');

-- CreateTable
CREATE TABLE "AppointmentLetter" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "companyEmail" TEXT,
    "companyPhone" TEXT,
    "letterDate" TIMESTAMP(3),
    "recipientName" TEXT NOT NULL,
    "recipientAddress" TEXT,
    "jobTitle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "jobResponsibilities" TEXT,
    "salaryAmount" DOUBLE PRECISION,
    "salaryPaymentFrequency" "SalaryPaymentFrequency",
    "salaryEffectiveDate" TIMESTAMP(3),
    "signatoryName" TEXT,
    "employeeRefId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AppointmentLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentLetter_recipientName_idx" ON "AppointmentLetter"("recipientName");

-- CreateIndex
CREATE INDEX "AppointmentLetter_jobTitle_idx" ON "AppointmentLetter"("jobTitle");

-- CreateIndex
CREATE INDEX "AppointmentLetter_deletedAt_idx" ON "AppointmentLetter"("deletedAt");

-- CreateIndex
CREATE INDEX "AppointmentLetter_employeeRefId_idx" ON "AppointmentLetter"("employeeRefId");

-- AddForeignKey
ALTER TABLE "AppointmentLetter" ADD CONSTRAINT "AppointmentLetter_employeeRefId_fkey" FOREIGN KEY ("employeeRefId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
