-- CreateTable
CREATE TABLE "OfferLetter" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "annualCtc" DOUBLE PRECISION,
    "joiningDate" TIMESTAMP(3),
    "workLocation" TEXT,
    "letterDate" TIMESTAMP(3),
    "hrName" TEXT,
    "hrDesignation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalarySlip" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "month" TEXT NOT NULL,
    "basic" DOUBLE PRECISION NOT NULL,
    "hra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conveyance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "special" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalarySlip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferLetter_candidateName_idx" ON "OfferLetter"("candidateName");

-- CreateIndex
CREATE INDEX "SalarySlip_month_idx" ON "SalarySlip"("month");

-- CreateIndex
CREATE INDEX "SalarySlip_employeeName_idx" ON "SalarySlip"("employeeName");

-- CreateIndex
CREATE INDEX "SalarySlip_employeeId_month_company_idx" ON "SalarySlip"("employeeId", "month", "company");
