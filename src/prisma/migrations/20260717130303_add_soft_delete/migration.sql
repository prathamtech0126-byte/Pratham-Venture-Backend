-- AlterTable
ALTER TABLE "OfferLetter" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SalarySlip" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OfferLetter_deletedAt_idx" ON "OfferLetter"("deletedAt");

-- CreateIndex
CREATE INDEX "SalarySlip_deletedAt_idx" ON "SalarySlip"("deletedAt");
