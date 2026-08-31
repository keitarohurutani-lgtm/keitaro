"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Trend } from "@/generated/prisma/client";
import { PERSONA_LABEL, PERSONA_OPTIONS } from "@/lib/persona";
import { usePersonaPreference } from "@/lib/use-persona-preference";
import { toast } from "@/lib/toast";
import ContentProposalWizard from "@/components/ContentProposalWizard";

type Mode = "trend" | "original";

export default function IdeaGenerator({
  trends,
  initialTrendId,
}: {
  trends: Trend[];
  initialTrendId?: string;
}) {
  const router = useRouter();
  // 初めての人でも迷わないよう、質問に答えるだけの「条件を選んで作る」を初期表示にする
  // （トレンド一覧をいきなり見せるより、次に何をすればいいか分かりやすいため）。
  const [mode, setMode] = useState<Mode>("original");
  const [trendId, setTrendId] = useState(initialTrendId ?? trends[0]?.id ?? "");
  const [persona, setPersona] = usePersonaPreference();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateFromTrend = async () => {
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

  return (
    <div className="rounded-2xl border border-al-gray-200 p-5">
      <p className="font-display text-xs font-bold tracking-widest text-al-pink">
        NEW IDEA
      </p>
      <h2 className="mt-1 font-display text-lg font-bold">新しい企画を提案してもらう</h2>
      <p className="mt-1 text-sm text-al-gray-500">2つの作り方から選べます。</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("original")}
          className={`relative rounded-2xl border-2 p-4 text-left transition-colors ${
            mode === "original"
              ? "border-al-black bg-al-black text-white"
              : "border-al-gray-200 hover:border-al-gray-400"
          }`}
        >
          <span className="al-sticker absolute -top-2.5 right-3 rounded-full px-2 py-0.5 font-display text-[10px] font-bold text-al-black">
            初めての方はこちら
          </span>
          <p className="font-display text-sm font-bold">📝 条件を選んで作る</p>
          <p className={`mt-1 text-xs leading-relaxed ${mode === "original" ? "text-al-gray-300" : "text-al-gray-500"}`}>
            かんたんな質問に答えるだけで、企画案を3つ考えてもらえます。
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMode("trend")}
          className={`rounded-2xl border-2 p-4 text-left transition-colors ${
            mode === "trend"
              ? "border-al-black bg-al-black text-white"
              : "border-al-gray-200 hover:border-al-gray-400"
          }`}
        >
          <p className="font-display text-sm font-bold">🔥 トレンドから選ぶ</p>
          <p className={`mt-1 text-xs leading-relaxed ${mode === "trend" ? "text-al-gray-300" : "text-al-gray-500"}`}>
            今伸びているネタの中から、気になるものを選んで企画にします。
          </p>
        </button>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-500">
          あなたのタイプ
        </label>
        <p className="mb-1.5 text-xs text-al-gray-400">
          自分のキャラクターに近いものを選んでください。企画の雰囲気に反映されます。
        </p>
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

      {mode === "trend" ? (
        <div className="mt-4 space-y-4">
          {trends.length === 0 ? (
            <p className="rounded-xl bg-al-gray-50 px-3 py-2.5 text-sm text-al-gray-500">
              トレンドがまだありません。まずは <code className="text-xs">npm run seed</code>{" "}
              でトレンドを用意してください。
            </p>
          ) : (
            <div>
              <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-500">
                トレンド
              </label>
              <p className="mb-1.5 text-xs text-al-gray-400">
                気になるトレンドを1つ選んでください。
              </p>
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
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <button
            onClick={handleGenerateFromTrend}
            disabled={loading || trends.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-al-black px-6 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-al-gray-600 disabled:opacity-60"
          >
            {loading ? "AIが考え中…" : "AIに企画を提案してもらう"}
          </button>
        </div>
      ) : (
        <ContentProposalWizard persona={persona} />
      )}
    </div>
  );
}
