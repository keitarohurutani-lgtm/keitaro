"use client";

import { useState } from "react";
import type { Idea, Trend } from "@/generated/prisma/client";
import type { Persona } from "@/generated/prisma/enums";
import CategoryTag from "@/components/CategoryTag";
import SaveIdeaButton from "@/components/SaveIdeaButton";
import { PERSONA_LABEL } from "@/lib/persona";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/content-proposal";

type IdeaWithTrend = Idea & { trend: Trend | null };

type Filter = "all" | "saved";

export default function IdeaList({ ideas }: { ideas: IdeaWithTrend[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const savedCount = ideas.filter((idea) => idea.saved).length;
  const visible = filter === "saved" ? ideas.filter((idea) => idea.saved) : ideas;

  if (ideas.length === 0) {
    return (
      <p className="mt-10 rounded-2xl border border-al-gray-200 p-6 text-center text-sm text-al-gray-400">
        まだ企画がありません。上のフォームからAIに提案してもらいましょう。
      </p>
    );
  }

  return (
    <div className="mt-10">
      <div className="inline-flex rounded-full border border-al-gray-200 p-1">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 font-display text-xs font-bold transition-colors ${
            filter === "all" ? "bg-al-black text-white" : "text-al-gray-500"
          }`}
        >
          すべて（{ideas.length}）
        </button>
        <button
          onClick={() => setFilter("saved")}
          className={`rounded-full px-4 py-1.5 font-display text-xs font-bold transition-colors ${
            filter === "saved" ? "bg-al-black text-white" : "text-al-gray-500"
          }`}
        >
          保存済み（{savedCount}）
        </button>
      </div>

      <div className="mt-6 space-y-10">
        {visible.length === 0 && (
          <p className="rounded-2xl border border-al-gray-200 p-6 text-center text-sm text-al-gray-400">
            保存済みの企画はまだありません。
          </p>
        )}
        {visible.map((idea) => (
          <article
            key={idea.id}
            id={idea.id}
            className="al-flyer-card scroll-mt-24 overflow-hidden rounded-2xl"
          >
            {/* TREND or ORIGINAL */}
            {idea.trend ? (
              <div className="flex items-center gap-3 border-b-2 border-al-black bg-al-gray-50 px-5 py-3">
                <span className="font-display text-[11px] font-bold tracking-widest text-al-gray-400">
                  TREND
                </span>
                <CategoryTag category={idea.trend.category} />
                <span className="text-sm font-bold">{idea.trend.name}</span>
                <span className="ml-auto -rotate-3 rounded-full border-2 border-al-lime bg-al-black px-2 py-0.5 font-display text-xs font-bold text-al-lime">
                  {idea.trend.growth}
                </span>
              </div>
            ) : (
              <div className="border-b-2 border-al-black bg-al-gray-50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[11px] font-bold tracking-widest text-al-gray-400">
                    ORIGINAL
                  </span>
                  <span className="inline-flex items-center rounded-md bg-al-purple px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-white">
                    オリジナル
                  </span>
                  {idea.platform && (PLATFORMS as readonly string[]).includes(idea.platform) && (
                    <span className="text-[11px] font-bold text-al-gray-400">
                      {PLATFORM_LABEL[idea.platform as Platform]}向け
                    </span>
                  )}
                </div>
                {idea.customPrompt && (
                  <p className="mt-1.5 text-xs leading-relaxed text-al-gray-500">
                    あなたの指示：「{idea.customPrompt}」
                  </p>
                )}
              </div>
            )}

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
                  ["企画内容", idea.concept],
                  ["撮影場所", idea.location],
                  ["表情", idea.expression],
                  ["構成", idea.structure],
                  ["尺", idea.duration],
                  ["撮影難易度", idea.difficulty],
                  ["オチ", idea.punchline],
                ]
                  .filter((row): row is [string, string] => Boolean(row[1]))
                  .map(([label, value]) => (
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
