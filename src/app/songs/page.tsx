import { prisma } from "@/lib/prisma";
import { getWeekStart, formatWeekLabel } from "@/lib/week";
import SongsClient from "./SongsClient";

// sync-songsで更新される最新ランキングを毎回反映するため、静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function SongsPage() {
  const weekStart = getWeekStart(new Date());
  const songs = await prisma.songRanking.findMany({
    where: { weekOf: weekStart },
    orderBy: { rank: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-purple">SONGS</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">音源 週間ランキング</h1>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        今伸びている音源をTOP{songs.length || 50}で毎週更新しています。曲名・アーティスト名・MVや音源のリンク・主な使用用途をチェックできます。
      </p>
      <p className="mt-1 text-xs text-al-gray-400">{formatWeekLabel(weekStart)}のランキング</p>

      <SongsClient songs={songs} />
    </div>
  );
}
