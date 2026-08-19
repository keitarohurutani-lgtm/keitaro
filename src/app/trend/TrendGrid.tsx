"use client";

import { useState } from "react";
import Link from "next/link";
import type { Trend } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/data";
import TrendCard from "@/components/TrendCard";

export default function TrendGrid({ trends }: { trends: Trend[] }) {
  const [active, setActive] = useState<"すべて" | (typeof CATEGORIES)[number]>("すべて");

  const filtered = active === "すべて" ? trends : trends.filter((t) => t.category === active);

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
    </>
  );
}
