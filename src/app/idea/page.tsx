import { prisma } from "@/lib/prisma";
import CategoryTag from "@/components/CategoryTag";
import IdeaGenerator from "@/components/IdeaGenerator";
import SaveIdeaButton from "@/components/SaveIdeaButton";
import { PERSONA_LABEL } from "@/lib/persona";
import type { Persona } from "@/generated/prisma/enums";

export default async function IdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ trendId?: string }>;
}) {
  const { trendId } = await searchParams;

  const [trends, ideas] = await Promise.all([
    prisma.trend.findMany({ orderBy: { fetchedAt: "desc" } }),
    prisma.idea.findMany({
      orderBy: { createdAt: "desc" },
      include: { trend: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-pink">IDEA</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
        あなたに合う投稿ネタを見つける
      </h1>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        トレンドをもとに、AIがあなたのキャラクターに合いそうな企画を提案します。正解ではなく候補として、気になるものから試してみましょう。
      </p>

      <div className="mt-8">
        <IdeaGenerator trends={trends} initialTrendId={trendId} />
      </div>

      <div className="mt-10 space-y-10">
        {ideas.length === 0 && (
          <p className="rounded-2xl border border-al-gray-200 p-6 text-center text-sm text-al-gray-400">
            まだ企画がありません。上のフォームからAIに提案してもらいましょう。
          </p>
        )}
        {ideas.map((idea) => (
          <article
            key={idea.id}
            id={idea.id}
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-al-gray-200"
          >
            {/* TREND */}
            <div className="flex items-center gap-3 border-b border-al-gray-100 bg-al-gray-50 px-5 py-3">
              <span className="font-display text-[11px] font-bold tracking-widest text-al-gray-400">
                TREND
              </span>
              <CategoryTag category={idea.trend.category} />
              <span className="text-sm font-bold">{idea.trend.name}</span>
              <span className="ml-auto rounded-full bg-al-black px-2 py-0.5 font-display text-xs font-bold text-al-lime">
                {idea.trend.growth}
              </span>
            </div>

            {/* YOUR IDEA */}
            <div className="px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[11px] font-bold tracking-widest text-al-purple">
                  YOUR IDEA
                </span>
                {idea.persona && (
                  <span className="text-[11px] text-al-gray-400">
                    {PERSONA_LABEL[idea.persona as Persona].split("・")[0]}向け
                  </span>
                )}
              </div>
              <h2 className="mt-1 font-display text-xl font-bold leading-snug md:text-2xl">
                {idea.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-al-gray-600">{idea.reason}</p>
            </div>

            {/* POST PLAN */}
            <div className="border-t border-al-gray-100 bg-al-gray-50 px-5 py-5">
              <span className="font-display text-[11px] font-bold tracking-widest text-al-blue">
                POST PLAN
              </span>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["冒頭1秒", idea.opening],
                  ["撮影場所", idea.location],
                  ["表情", idea.expression],
                  ["構成", idea.structure],
                  ["尺", idea.duration],
                  ["オチ", idea.punchline],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white p-3">
                    <dt className="font-display text-xs font-bold text-al-gray-400">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex justify-end border-t border-al-gray-100 px-5 py-4">
              <SaveIdeaButton ideaId={idea.id} initialSaved={idea.saved} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
