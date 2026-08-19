import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getReportCounts } from "@/lib/report";
import { getCurrentUserId } from "@/lib/auth";
import TrendCard from "@/components/TrendCard";

// このページはDBの最新状態（企画・トレンド・活動件数）を毎回反映する必要があるため、
// ビルド時の静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [latestIdea, pickedTrends, counts] = await Promise.all([
    prisma.idea.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { trend: true },
    }),
    prisma.trend.findMany({ take: 5, orderBy: { fetchedAt: "desc" } }),
    getReportCounts(userId),
  ]);

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
            今日のあなたにおすすめ。
          </h1>

          <div className="mt-8 max-w-xl space-y-4">
            {latestIdea ? (
              <>
                <p className="text-base leading-relaxed text-al-gray-300 md:text-lg">
                  最近、{latestIdea.trend.name}系の投稿が伸びています。
                </p>
                <p className="font-display text-xl font-bold leading-snug text-white md:text-2xl">
                  あなたのキャラクターなら、『{latestIdea.title}』企画がおすすめです。
                </p>

                <ul className="space-y-2 pt-2">
                  {[
                    `表情：${latestIdea.expression}`,
                    `撮影場所：${latestIdea.location}`,
                    `オチ：${latestIdea.punchline}`,
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-al-gray-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-al-pink" />
                      {tip}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/idea#${latestIdea.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-al-pink px-6 py-3 font-display text-sm font-bold text-white transition-transform hover:scale-[1.02]"
                >
                  企画を見る
                  <span aria-hidden>→</span>
                </Link>
              </>
            ) : (
              <>
                <p className="text-base leading-relaxed text-al-gray-300 md:text-lg">
                  まだAIが企画を提案していません。
                </p>
                <p className="font-display text-xl font-bold leading-snug text-white md:text-2xl">
                  気になるトレンドをチェックして、あなたに合う企画を生成してみましょう。
                </p>
                <Link
                  href="/trend"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-al-pink px-6 py-3 font-display text-sm font-bold text-white transition-transform hover:scale-[1.02]"
                >
                  トレンドを見る
                  <span aria-hidden>→</span>
                </Link>
              </>
            )}
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
              href="/analyze?tab=check"
              className="rounded-2xl border-2 border-al-black bg-al-blue p-5 text-white transition-transform hover:scale-[1.01]"
            >
              <p className="font-display text-xs font-bold tracking-widest">POST CHECK</p>
              <p className="mt-2 font-display text-lg font-bold">動画をチェック</p>
              <p className="mt-1 text-sm text-blue-100">あなたの投稿をAIで簡易分析</p>
            </Link>
            <Link
              href="/analyze?tab=benchmark"
              className="rounded-2xl border-2 border-al-lime bg-al-black p-5 text-white transition-transform hover:scale-[1.01]"
            >
              <p className="font-display text-xs font-bold tracking-widest">BENCHMARK</p>
              <p className="mt-2 font-display text-lg font-bold">伸びている投稿と比べる</p>
              <p className="mt-1 text-sm text-al-gray-300">違いを見つけて次の一歩へ</p>
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
