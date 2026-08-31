import { prisma } from "@/lib/prisma";
import { getWeekStart, formatWeekLabel } from "@/lib/week";
import SongsClient from "./SongsClient";

// sync-songsで更新される最新ランキングを毎回反映するため、静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function SongsPage() {
  const weekStart = getWeekStart(new Date());

  // 同期（sync-songs）がまだ今週分を終えていない・実行前でも、ページを空にせず
  // 直近で同期済みの週のランキングを表示し続ける（週替わり直後の空白期間対策）。
  const latestWeek = await prisma.songRanking.findFirst({
    orderBy: { weekOf: "desc" },
    select: { weekOf: true },
  });

  const displayWeek = latestWeek?.weekOf ?? weekStart;
  const songs = latestWeek
    ? await prisma.songRanking.findMany({
        where: { weekOf: displayWeek },
        orderBy: [{ usageType: "asc" }, { rank: "asc" }],
      })
    : [];

  const isStale = latestWeek ? displayWeek.getTime() !== weekStart.getTime() : false;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-purple">SONGS</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">音源 週間ランキング</h1>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        踊ってみた・ネタ系・Vlog系・その他の4つの使用用途ごとに、今伸びている音源をTOP20（最大80曲）で毎週更新しています。曲名・アーティスト名・MVや音源のリンクをチェックできます。
      </p>
      <p className="mt-2 max-w-xl text-xs leading-relaxed text-al-gray-400">
        並び順は再生数ではなく「この用途でいろいろ検索した中に、同じ曲が何本見つかったか」の多い順です（TikTok本体の使用数そのものではなく、今回の検索範囲内での参考値です）。
      </p>
      <p className="mt-1 text-xs text-al-gray-400">
        {formatWeekLabel(displayWeek)}のランキング
        {isStale && "（今週分は準備中のため、直近の更新分を表示しています）"}
      </p>

      <SongsClient songs={songs} />
    </div>
  );
}
