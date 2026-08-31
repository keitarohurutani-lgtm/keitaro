import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/week";
import TrendGrid from "./TrendGrid";

// sync-trendsで更新されるDBの最新トレンドを毎回反映するため、静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function TrendPage() {
  const weekStart = getWeekStart(new Date());
  // 「音源」は/songsの専用ランキングに一本化したため、TRENDからは除外する。
  const [trends, rankings] = await Promise.all([
    prisma.trend.findMany({
      where: { category: { not: "音源" } },
      orderBy: { fetchedAt: "desc" },
    }),
    prisma.trendRanking.findMany({
      where: { weekOf: weekStart, category: { not: "音源" } },
      orderBy: [{ category: "asc" }, { rank: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-purple">
        TREND
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
        今、注目されているトレンド
      </h1>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        SNS・ファッション・TikTokなど、今伸びている動きをカテゴリー別にチェックできます。カテゴリーを選ぶと週間ランキングも見られます。気になるものはIDEAで企画に変換してみましょう。音源の週間ランキングはSONGSページへ。
      </p>

      <TrendGrid trends={trends} rankings={rankings} weekStart={weekStart} />
    </div>
  );
}
