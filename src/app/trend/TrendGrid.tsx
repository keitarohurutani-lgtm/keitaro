"use client";

import { useState } from "react";
import Link from "next/link";
import type { Trend, TrendRanking } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/data";
import TrendCard from "@/components/TrendCard";
import { formatWeekLabel } from "@/lib/week";

const RANKING_SIZE = 5;

export default function TrendGrid({
  trends,
  rankings,
  weekStart,
}: {
  trends: Trend[];
  rankings: TrendRanking[];
  weekStart: Date;
}) {
  const [active, setActive] = useState<"すべて" | (typeof CATEGORIES)[number]>("すべて");

  const filtered = active === "すべて" ? trends : trends.filter((t) => t.category === active);
  const activeRankings =
    active === "すべて" ? [] : rankings.filter((r) => r.category === active);

  return (
    <>
      <div className="al-rail mt-6 flex gap-2 overflow-x-auto pb-2">
        {(["すべて", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`shrink-0 rounded-full px-4 py-2 font-display text-sm font-bold transition-colors ${
              active === c
                ? "bg-al-black text-white"
                : "bg-al-gray-100 text-al-gray-600 hover:bg-al-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((trend) => (
          <TrendCard
            key={trend.id}
            trend={trend}
            className="w-full"
            footer={
              <Link
                href={`/idea?trendId=${trend.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-al-purple hover:underline"
              >
                この企画をAIに提案してもらう →
              </Link>
            }
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-al-gray-400">
            このカテゴリーのトレンドは準備中です。
          </p>
        )}
      </div>

      {active === "すべて" ? (
        <p className="mt-10 rounded-2xl border border-dashed border-al-gray-200 p-6 text-center text-sm text-al-gray-400">
          カテゴリーを選ぶと、そのジャンルの週間ランキングTOP{RANKING_SIZE}が見られます。
        </p>
      ) : (
        <div className="al-flyer-card mt-10 rounded-2xl p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold">{active}の週間ランキング</h2>
            <span className="font-display text-xs font-bold text-al-gray-400">
              {formatWeekLabel(weekStart)}
            </span>
          </div>
          {activeRankings.length === 0 ? (
            <p className="mt-4 text-sm text-al-gray-400">
              今週のランキングはまだ準備中です。
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {activeRankings.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-al-gray-100 p-3"
                >
                  <span className="al-sticker flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold">
                    {item.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold">{item.title}</p>
                    {(item.artistName || item.songTitle) && (
                      <p className="text-xs font-bold text-al-purple">
                        🎵 {item.artistName ?? "アーティスト不明"}
                        {item.songTitle ? ` - ${item.songTitle}` : ""}
                      </p>
                    )}
                    <p className="text-xs text-al-gray-500">
                      {item.channelUrl ? (
                        <a
                          href={item.channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-al-gray-600 hover:underline"
                        >
                          {item.channelTitle}
                        </a>
                      ) : (
                        item.channelTitle
                      )}{" "}
                      ・ {item.growth}
                    </p>
                  </div>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-bold text-al-blue hover:underline"
                    >
                      見る →
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </>
  );
}
