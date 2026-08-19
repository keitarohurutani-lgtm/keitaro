"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Trend } from "@/generated/prisma/client";
import { PERSONA_LABEL, PERSONA_OPTIONS } from "@/lib/persona";
import { usePersonaPreference } from "@/lib/use-persona-preference";
import { toast } from "@/lib/toast";

export default function IdeaGenerator({
  trends,
  initialTrendId,
}: {
  trends: Trend[];
  initialTrendId?: string;
}) {
  const router = useRouter();
  const [trendId, setTrendId] = useState(initialTrendId ?? trends[0]?.id ?? "");
  const [persona, setPersona] = usePersonaPreference();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!trendId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trendId, persona }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "企画の生成に失敗しました。");
      }
      toast("AIが企画を提案しました");
      router.refresh();
      router.push(`/idea?trendId=${trendId}#${json.idea.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "企画の生成に失敗しました。";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (trends.length === 0) {
    return (
      <div className="rounded-2xl border border-al-gray-200 p-6 text-sm text-al-gray-500">
        トレンドがまだありません。まずは <code className="text-xs">npm run seed</code>{" "}
        でトレンドを用意してください。
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-al-gray-200 p-5">
      <p className="font-display text-xs font-bold tracking-widest text-al-pink">
        NEW IDEA
      </p>
      <h2 className="mt-1 font-display text-lg font-bold">新しい企画を提案してもらう</h2>
      <p className="mt-1 text-sm text-al-gray-500">
        トレンドとあなたのタイプを選ぶと、AIが投稿企画を1つ提案します。
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-500">
            トレンド
          </label>
          <select
            value={trendId}
            onChange={(e) => setTrendId(e.target.value)}
            className="w-full rounded-xl border border-al-gray-200 bg-white px-3 py-2.5 text-sm"
          >
            {trends.map((trend) => (
              <option key={trend.id} value={trend.id}>
                {trend.category} / {trend.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-500">
            あなたのタイプ
          </label>
          <div className="flex flex-wrap gap-2">
            {PERSONA_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPersona(option)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  persona === option
                    ? "bg-al-black text-white"
                    : "bg-al-gray-100 text-al-gray-600 hover:bg-al-gray-200"
                }`}
              >
                {PERSONA_LABEL[option].split("・")[0]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-al-black px-6 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-al-gray-600 disabled:opacity-60"
        >
          {loading ? "AIが考え中…" : "AIに企画を提案してもらう"}
        </button>
      </div>
    </div>
  );
}
