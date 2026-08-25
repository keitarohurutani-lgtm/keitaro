-- CreateEnum
CREATE TYPE "TrendSource" AS ENUM ('SEED', 'YOUTUBE', 'TIKTOK', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TREND_CHECK', 'IDEA_SAVED', 'POST_CHECK', 'BENCHMARK');

-- CreateEnum
CREATE TYPE "Persona" AS ENUM ('GENKI', 'COOL', 'HONWAKA', 'DOKUZETSU', 'SEITOHA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trend" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "whyHot" TEXT NOT NULL,
    "howToUse" TEXT NOT NULL,
    "growth" TEXT NOT NULL,
    "thumbnailFrom" TEXT NOT NULL,
    "thumbnailTo" TEXT NOT NULL,
    "source" "TrendSource" NOT NULL DEFAULT 'SEED',
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "artistName" TEXT,
    "songTitle" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendRanking" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "artistName" TEXT,
    "songTitle" TEXT,
    "viewCount" INTEGER NOT NULL,
    "growth" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trendId" TEXT NOT NULL,
    "persona" "Persona",
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "opening" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "punchline" TEXT NOT NULL,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "generatedByAI" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Trend_category_idx" ON "Trend"("category");

-- CreateIndex
CREATE INDEX "TrendRanking_category_weekOf_idx" ON "TrendRanking"("category", "weekOf");

-- CreateIndex
CREATE UNIQUE INDEX "TrendRanking_category_weekOf_rank_key" ON "TrendRanking"("category", "weekOf", "rank");

-- CreateIndex
CREATE INDEX "Idea_userId_idx" ON "Idea"("userId");

-- CreateIndex
CREATE INDEX "Idea_saved_idx" ON "Idea"("saved");

-- CreateIndex
CREATE INDEX "Idea_createdAt_idx" ON "Idea"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
