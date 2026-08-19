/*
  Warnings:

  - Added the required column `userId` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Idea` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Activity" ("createdAt", "id", "text", "type") SELECT "createdAt", "id", "text", "type" FROM "Activity";
DROP TABLE "Activity";
ALTER TABLE "new_Activity" RENAME TO "Activity";
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX "Activity_type_idx" ON "Activity"("type");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE TABLE "new_Idea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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
    CONSTRAINT "Idea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Idea_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Idea" ("createdAt", "duration", "expression", "generatedByAI", "id", "location", "opening", "persona", "punchline", "reason", "saved", "structure", "title", "trendId") SELECT "createdAt", "duration", "expression", "generatedByAI", "id", "location", "opening", "persona", "punchline", "reason", "saved", "structure", "title", "trendId" FROM "Idea";
DROP TABLE "Idea";
ALTER TABLE "new_Idea" RENAME TO "Idea";
CREATE INDEX "Idea_userId_idx" ON "Idea"("userId");
CREATE INDEX "Idea_saved_idx" ON "Idea"("saved");
CREATE INDEX "Idea_createdAt_idx" ON "Idea"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
