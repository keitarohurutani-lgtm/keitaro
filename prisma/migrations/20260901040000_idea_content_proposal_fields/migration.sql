-- AlterTable: add fields for the SNS content proposal flow, and relax three
-- POST PLAN fields to nullable (proposal-based ideas don't map cleanly onto
-- them; existing trend-based generation still always supplies a value).
ALTER TABLE "Idea" ADD COLUMN "platform" TEXT;
ALTER TABLE "Idea" ADD COLUMN "concept" TEXT;
ALTER TABLE "Idea" ADD COLUMN "difficulty" TEXT;
ALTER TABLE "Idea" ALTER COLUMN "location" DROP NOT NULL;
ALTER TABLE "Idea" ALTER COLUMN "expression" DROP NOT NULL;
ALTER TABLE "Idea" ALTER COLUMN "punchline" DROP NOT NULL;
