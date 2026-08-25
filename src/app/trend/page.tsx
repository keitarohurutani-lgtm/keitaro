import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/week";
import TrendGrid from "./TrendGrid";

// sync-trendsで更新されるDBの最新トレンドを毎回反映するため、静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function TrendPage() {
  const weekStart = getWeekStart(new Date());
  const [trends, rankings] = await Promise.all([
    prisma.trend.findMany({ orderBy: { fetchedAt: "desc" } }),
    prisma.trendRanking.findMany({
      where: { weekOf: weekStart },
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
        SNS・音源・ファッションなど、今伸びている動きをカテゴリー別にチェックできます。カテゴリーを選ぶと週間ランキングも見られます。気になるものはIDEAで企画に変換してみましょう。
      </p>

      <TrendGrid trends={trends} rankings={rankings} weekStart={weekStart} />
    </div>
  );
}
