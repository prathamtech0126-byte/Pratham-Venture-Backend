-- AlterTable
ALTER TABLE "OfferLetter" ADD COLUMN     "employeeRefId" INTEGER;

-- AlterTable
ALTER TABLE "SalarySlip" ADD COLUMN     "employeeRefId" INTEGER;

-- CreateIndex
CREATE INDEX "OfferLetter_employeeRefId_idx" ON "OfferLetter"("employeeRefId");

-- CreateIndex
CREATE INDEX "SalarySlip_employeeRefId_idx" ON "SalarySlip"("employeeRefId");

-- AddForeignKey
ALTER TABLE "OfferLetter" ADD CONSTRAINT "OfferLetter_employeeRefId_fkey" FOREIGN KEY ("employeeRefId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_employeeRefId_fkey" FOREIGN KEY ("employeeRefId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
