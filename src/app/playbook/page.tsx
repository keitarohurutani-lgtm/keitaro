import { prisma } from "@/lib/prisma";
import { isCategory } from "@/lib/data";
import { getCurrentUserId } from "@/lib/auth";
import PlaybookClient from "./PlaybookClient";

// sync-trendsで更新される最新トレンドを毎回反映するため、静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  const userId = await getCurrentUserId();

  const [trends, favorites] = await Promise.all([
    prisma.trend.findMany({ orderBy: { fetchedAt: "desc" } }),
    userId
      ? prisma.playbookFavorite.findMany({ where: { userId }, select: { playbookIdeaId: true } })
      : Promise.resolve([]),
  ]);

  // カテゴリーごとに最新の実トレンドを1件だけ拾う（先頭が最新）
  const currentTrends: Record<string, (typeof trends)[number]> = {};
  for (const trend of trends) {
    if (isCategory(trend.category) && !currentTrends[trend.category]) {
      currentTrends[trend.category] = trend;
    }
  }

  const initialFavoriteIds = favorites.map((f) => f.playbookIdeaId);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-blue">PLAYBOOK</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">ネタ集</h1>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        スマホ1台でそのまま真似できる、投稿の「型」を集めました。カテゴリーを選ぶと、今そのジャンルで伸びている実際のトレンドもあわせて見られます。
      </p>

      <PlaybookClient currentTrends={currentTrends} initialFavoriteIds={initialFavoriteIds} />
    </div>
  );
}
