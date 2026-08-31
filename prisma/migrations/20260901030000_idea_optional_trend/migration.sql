-- AlterTable: allow ideas generated from a free-form instruction (no Trend row)
ALTER TABLE "Idea" ALTER COLUMN "trendId" DROP NOT NULL;
ALTER TABLE "Idea" ADD COLUMN "customPrompt" TEXT;
