-- CreateTable
CREATE TABLE "Trend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "whyHot" TEXT NOT NULL,
    "howToUse" TEXT NOT NULL,
    "growth" TEXT NOT NULL,
    "thumbnailFrom" TEXT NOT NULL,
    "thumbnailTo" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SEED',
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trendId" TEXT NOT NULL,
    "persona" TEXT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Idea_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Trend_category_idx" ON "Trend"("category");

-- CreateIndex
CREATE INDEX "Idea_saved_idx" ON "Idea"("saved");

-- CreateIndex
CREATE INDEX "Idea_createdAt_idx" ON "Idea"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
