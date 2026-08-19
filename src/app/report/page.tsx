import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getReportCounts, getWeeklyActivity, formatRelativeDate } from "@/lib/report";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

// 活動集計・週間アクティビティは毎回のDB最新状態を反映する必要があるため、
// ビルド時の静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const [counts, weekly, recentActivities] = await Promise.all([
    getReportCounts(user.id),
    getWeeklyActivity(user.id, now),
    prisma.activity.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const maxCount = Math.max(...weekly.map((d) => d.count), 1);
  const totalThisWeek = weekly.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs font-bold tracking-[0.2em] text-al-gray-500">
            MY REPORT
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
            SNS活動を振り返る
          </h1>
        </div>
        <div className="pt-1 text-right">
          <p className="font-display text-sm font-bold">{user.displayName}</p>
          <LogoutButton className="mt-1" />
        </div>
      </div>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        投稿・分析・保存した企画など、あなたの活動量を可視化します。継続の振り返りに使ってみましょう。
      </p>

      {/* Stat grid */}
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "分析した投稿", value: counts.analyzedPosts, accent: "text-al-blue" },
          { label: "保存した企画", value: counts.savedIdeas, accent: "text-al-purple" },
          { label: "参考にした投稿", value: counts.referencedPosts, accent: "text-al-pink" },
          { label: "トレンドチェック", value: counts.trendChecks, accent: "text-al-black" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-al-gray-200 p-4">
            <p className={`font-display text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
            <p className="mt-1 text-xs text-al-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="mt-8 rounded-2xl border border-al-gray-200 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold">週間アクティビティ</h2>
          <p className="font-display text-sm font-bold text-al-gray-500">
            過去7日間で{totalThisWeek}件
          </p>
        </div>
        <p className="mt-1 text-xs text-al-gray-400">
          企画生成・保存・POST CHECK・BENCHMARKの実行回数の合計です。
        </p>
        <div className="mt-6 flex items-end justify-between gap-2">
          {weekly.map((d) => (
            <div key={d.dateLabel} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end">
                <div
                  className={`w-full rounded-t-md ${d.count > 0 ? "bg-al-black" : "bg-al-gray-100"}`}
                  style={{
                    height: `${d.count === 0 ? 4 : (d.count / maxCount) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-al-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold">最近のアクティビティ</h2>
        {recentActivities.length === 0 ? (
          <p className="mt-4 rounded-xl border border-al-gray-200 p-4 text-sm text-al-gray-400">
            まだアクティビティがありません。IDEAやANALYZEを使ってみましょう。
          </p>
        ) : (
          <ul className="mt-4 space-y-3 border-l-2 border-al-gray-100 pl-4">
            {recentActivities.map((item) => (
              <li key={item.id} className="relative text-sm leading-relaxed">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-al-pink" />
                <span className="mr-2 font-display text-xs font-bold text-al-gray-400">
                  {formatRelativeDate(item.createdAt)}
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
