-- CreateTable
CREATE TABLE "SongRanking" (
    "id" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "songTitle" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "usageType" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "viewCount" INTEGER NOT NULL,
    "growth" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongRanking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SongRanking_weekOf_idx" ON "SongRanking"("weekOf");

-- CreateIndex
CREATE UNIQUE INDEX "SongRanking_weekOf_rank_key" ON "SongRanking"("weekOf", "rank");
