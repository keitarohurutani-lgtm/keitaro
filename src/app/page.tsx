import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getReportCounts } from "@/lib/report";
import { getCurrentUserId } from "@/lib/auth";
import { getPlaybookRecommendations } from "@/lib/recommend";
import { getTodaysTip } from "@/lib/daily-tips";
import TrendCard from "@/components/TrendCard";
import CategoryTag from "@/components/CategoryTag";

// このページはDBの最新状態（企画・トレンド・活動件数）を毎回反映する必要があるため、
// ビルド時の静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [pickedTrends, counts, recommendations] = await Promise.all([
    prisma.trend.findMany({ take: 5, orderBy: { fetchedAt: "desc" } }),
    getReportCounts(userId),
    getPlaybookRecommendations(userId),
  ]);
  const tip = getTodaysTip();

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-al-black px-6 py-14 text-white md:px-8 md:py-20">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 bg-al-pink opacity-20 md:h-96 md:w-96"
          style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 bg-al-lime opacity-10"
          style={{ clipPath: "polygon(0 0, 100% 20%, 80% 100%, 0 100%)" }}
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="font-display text-xs font-bold tracking-[0.2em] text-al-lime">
            TODAY&apos;S ASOBI LAB
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-5xl">
            今日のSNS運用ポイント。
          </h1>

          <div className="mt-8 max-w-xl space-y-4">
            <span className="al-sticker inline-flex rounded-full px-3 py-1 font-display text-xs font-bold text-al-black">
              {tip.category}
            </span>
            <p className="font-display text-xl font-bold leading-snug text-white md:text-2xl">
              {tip.headline}
            </p>
            <p className="text-base leading-relaxed text-al-gray-300 md:text-lg">{tip.body}</p>

            <Link
              href="/idea"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-al-pink px-6 py-3 font-display text-sm font-bold text-white transition-transform hover:scale-[1.02]"
            >
              このポイントを意識して投稿ネタを探す
              <span aria-hidden>→</span>
            </Link>
            <p className="pt-1 text-xs text-al-gray-400">
              明日はまた違うポイントが表示されます。毎日チェックしてみましょう。
            </p>
          </div>
        </div>
      </section>

      {/* CYCLE */}
      <section className="border-b border-al-gray-100 px-6 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { step: "発見", desc: "トレンドを知る", href: "/trend" },
              { step: "企画", desc: "ネタを見つける", href: "/idea" },
              { step: "投稿", desc: "撮って投稿する", href: "/idea" },
              { step: "分析", desc: "振り返って磨く", href: "/analyze" },
            ].map((item, i) => (
              <Link
                key={item.step}
                href={item.href}
                className="al-flyer-card rounded-xl p-4 transition-transform hover:-translate-y-0.5"
              >
                <p className="font-display text-xs font-bold text-al-gray-400">
                  STEP {i + 1}
                </p>
                <p className="mt-1 font-display text-lg font-bold">{item.step}</p>
                <p className="mt-0.5 text-xs text-al-gray-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TODAY'S TREND */}
      <section className="px-6 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">TREND</h2>
              <p className="text-sm text-al-gray-500">今、注目されているトレンド</p>
            </div>
            <Link href="/trend" className="text-sm font-bold text-al-purple hover:underline">
              すべて見る →
            </Link>
          </div>
          {pickedTrends.length > 0 ? (
            <div className="al-rail -mx-6 flex gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:px-0">
              {pickedTrends.map((trend) => (
                <TrendCard key={trend.id} trend={trend} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-al-gray-200 p-6 text-sm text-al-gray-400">
              トレンドがまだありません。<code className="text-xs">npm run seed</code> を実行してください。
            </p>
          )}
        </div>
      </section>

      {/* RECOMMENDED PLAYBOOK */}
      <section className="px-6 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">あなたへのおすすめ</h2>
              <p className="text-sm text-al-gray-500">
                {recommendations.length > 0 && recommendations[0].reason === "今日のピックアップ"
                  ? "使うほど、あなた向けのおすすめになっていきます"
                  : "これまでの活動から、今日のネタをピックアップしました"}
              </p>
            </div>
            <Link href="/playbook" className="text-sm font-bold text-al-purple hover:underline">
              ネタ集を見る →
            </Link>
          </div>
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {recommendations.map(({ idea, reason }) => (
                <Link
                  key={idea.id}
                  href={`/playbook?category=${encodeURIComponent(idea.category)}`}
                  className="al-flyer-card flex flex-col gap-2 rounded-xl bg-white p-4 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <CategoryTag category={idea.category} />
                  </div>
                  <h3 className="font-display text-base font-bold leading-snug">{idea.title}</h3>
                  <p className="text-sm leading-relaxed text-al-gray-600">{idea.hook}</p>
                  <p className="mt-auto pt-2 text-[11px] font-bold text-al-gray-400">{reason}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-al-gray-200 p-6 text-sm text-al-gray-400">
              ネタ集はまだ準備中です。
            </p>
          )}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="bg-al-gray-50 px-6 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 font-display text-2xl font-bold">NEXT ACTION</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/idea"
              className="rounded-2xl border-2 border-al-black bg-al-purple p-5 text-white transition-transform hover:scale-[1.01]"
            >
              <p className="font-display text-xs font-bold tracking-widest">IDEA</p>
              <p className="mt-2 font-display text-lg font-bold">投稿ネタを探す</p>
              <p className="mt-1 text-sm text-purple-100">あなたに合う企画を見つける</p>
            </Link>
            <Link
              href="/playbook"
              className="rounded-2xl border-2 border-al-black bg-al-lime p-5 text-al-black transition-transform hover:scale-[1.01]"
            >
              <p className="font-display text-xs font-bold tracking-widest">PLAYBOOK</p>
              <p className="mt-2 font-display text-lg font-bold">ネタ集から探す</p>
              <p className="mt-1 text-sm text-al-gray-700">真似できる投稿の型を見る</p>
            </Link>
            <Link
              href="/analyze"
              className="rounded-2xl border-2 border-al-black bg-al-blue p-5 text-white transition-transform hover:scale-[1.01]"
            >
              <p className="font-display text-xs font-bold tracking-widest">POST CHECK</p>
              <p className="mt-2 font-display text-lg font-bold">動画をチェック</p>
              <p className="mt-1 text-sm text-blue-100">あなたの投稿をAIで簡易分析</p>
            </Link>
          </div>
        </div>
      </section>

      {/* REPORT SUMMARY */}
      <section className="px-6 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">MY REPORT</h2>
              <p className="text-sm text-al-gray-500">あなたの活動</p>
            </div>
            <Link href="/report" className="text-sm font-bold text-al-purple hover:underline">
              詳しく見る →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "分析した投稿", value: counts.analyzedPosts },
              { label: "保存した企画", value: counts.savedIdeas },
              { label: "参考にした投稿", value: counts.referencedPosts },
              { label: "トレンドチェック", value: counts.trendChecks },
            ].map((stat) => (
              <div key={stat.label} className="al-flyer-card rounded-xl p-4">
                <p className="font-display text-3xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-al-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
