-- CreateTable
CREATE TABLE "TrendRanking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "weekOf" DATETIME NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "artistName" TEXT,
    "songTitle" TEXT,
    "viewCount" INTEGER NOT NULL,
    "growth" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sourceUrl" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TrendRanking_category_weekOf_idx" ON "TrendRanking"("category", "weekOf");

-- CreateIndex
CREATE UNIQUE INDEX "TrendRanking_category_weekOf_rank_key" ON "TrendRanking"("category", "weekOf", "rank");
