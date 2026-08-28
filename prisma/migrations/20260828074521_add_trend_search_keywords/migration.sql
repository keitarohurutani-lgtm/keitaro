-- AlterTable
ALTER TABLE "Trend" ADD COLUMN     "searchKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
