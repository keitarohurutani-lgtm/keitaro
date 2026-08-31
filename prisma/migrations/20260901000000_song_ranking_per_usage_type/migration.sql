-- DropIndex
DROP INDEX "SongRanking_weekOf_rank_key";

-- CreateIndex
CREATE UNIQUE INDEX "SongRanking_weekOf_usageType_rank_key" ON "SongRanking"("weekOf", "usageType", "rank");
