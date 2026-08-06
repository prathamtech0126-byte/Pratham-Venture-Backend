-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('ANNUAL', 'MONTHLY');

-- AlterTable
ALTER TABLE "EmploymentVerificationLetter"
ADD COLUMN "monthlySalary" DOUBLE PRECISION,
ADD COLUMN "salaryPeriod" "SalaryPeriod" DEFAULT 'ANNUAL';
