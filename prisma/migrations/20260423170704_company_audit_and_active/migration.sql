-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_by" TEXT;

-- CreateIndex
CREATE INDEX "companies_is_active_idx" ON "companies"("is_active");
