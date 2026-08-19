"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BenchmarkVideo, PostCheckCut } from "@/lib/data";
import { toast } from "@/lib/toast";

type Tab = "check" | "benchmark";

const metricLabels: Record<keyof BenchmarkVideo["metrics"], string> = {
  opening: "冒頭",
  structure: "構成",
  framing: "画角",
  expression: "表情",
  tempo: "テンポ",
  editing: "編集",
};

export default function AnalyzeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "benchmark" ? "benchmark" : "check";

  const setTab = (next: Tab) => {
    router.replace(`/analyze?tab=${next}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-blue">ANALYZE</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
        {tab === "check" ? "あなたの動画をチェック" : "伸びている投稿と比べてみる"}
      </h1>

      <div className="mt-6 inline-flex rounded-full border border-al-gray-200 p-1">
        <button
          onClick={() => setTab("check")}
          className={`rounded-full px-5 py-2 font-display text-sm font-bold transition-colors ${
            tab === "check" ? "bg-al-black text-white" : "text-al-gray-500"
          }`}
        >
          POST CHECK
        </button>
        <button
          onClick={() => setTab("benchmark")}
          className={`rounded-full px-5 py-2 font-display text-sm font-bold transition-colors ${
            tab === "benchmark" ? "bg-al-black text-white" : "text-al-gray-500"
          }`}
        >
          BENCHMARK
        </button>
      </div>

      <div className="mt-8">{tab === "check" ? <PostCheckPanel /> : <BenchmarkPanel />}</div>
    </div>
  );
}

function PostCheckPanel() {
  const router = useRouter();
  const [cuts, setCuts] = useState<PostCheckCut[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/post-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoName: "カフェ巡り朝ルーティン.mp4" }),
      });
      if (!res.ok) throw new Error("分析の記録に失敗しました。");
      const json = await res.json();
      setCuts(json.cuts);
      toast("分析が完了しました");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "分析に失敗しました。";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="max-w-xl text-sm text-al-gray-500">
        動画をアップロードすると、6カットに分解して掴み・画角・表情・構成・テンポ・見せ方を簡易チェックします。
      </p>

      {!cuts ? (
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-al-gray-300 px-6 py-14 text-center transition-colors hover:border-al-black disabled:opacity-60"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-al-gray-100 font-display text-lg font-bold">
            {loading ? "…" : "+"}
          </span>
          <span className="font-display text-sm font-bold">
            {loading ? "分析中です…" : "動画をアップロードして分析する"}
          </span>
          <span className="text-xs text-al-gray-400">MP4 / MOV（サンプル動画で分析結果を表示します）</span>
        </button>
      ) : (
        <div className="mt-6">
          <div
            className="flex h-40 items-end rounded-2xl p-4 text-white"
            style={{ background: "linear-gradient(135deg,#0B0B0C,#2F7DFF)" }}
          >
            <p className="font-display text-sm font-bold">カフェ巡り朝ルーティン.mp4</p>
          </div>

          <div className="mt-4 rounded-xl bg-al-gray-50 px-4 py-3 text-xs leading-relaxed text-al-gray-600">
            ⚠️ AIによる参考分析です。100%正確ではありません。投稿改善のヒントとしてご活用ください。
          </div>

          <div className="mt-6 space-y-3">
            {cuts.map((cut) => (
              <div
                key={cut.index}
                className="flex items-start gap-4 rounded-xl border border-al-gray-200 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-al-black font-display text-sm font-bold text-white">
                  {cut.index}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-bold">{cut.label}</p>
                    <span className="text-xs text-al-gray-400">{cut.timestamp}</span>
                    <span
                      className={`ml-auto font-display text-base font-bold ${
                        cut.score === "◎"
                          ? "text-al-lime"
                          : cut.score === "○"
                            ? "text-al-blue"
                            : "text-al-pink"
                      }`}
                    >
                      {cut.score}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-al-gray-600">{cut.comment}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCuts(null)}
            className="mt-6 text-sm font-bold text-al-purple hover:underline"
          >
            別の動画を分析する
          </button>
        </div>
      )}
      {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function BenchmarkPanel() {
  const router = useRouter();
  const [result, setResult] = useState<{
    pair: { mine: BenchmarkVideo; reference: BenchmarkVideo };
    nextActions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/benchmark", { method: "POST" });
      if (!res.ok) throw new Error("比較の記録に失敗しました。");
      const json = await res.json();
      setResult(json);
      toast("比較が完了しました");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "比較に失敗しました。";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <div>
        <p className="max-w-xl text-sm text-al-gray-500">
          自分の投稿と参考にしたい投稿を項目別に比較し、どこが違うのかを可視化します。
        </p>
        <button
          onClick={runCompare}
          disabled={loading}
          className="mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-al-gray-300 px-6 py-14 text-center transition-colors hover:border-al-black disabled:opacity-60"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-al-gray-100 font-display text-lg font-bold">
            {loading ? "…" : "+"}
          </span>
          <span className="font-display text-sm font-bold">
            {loading ? "比較中です…" : "参考投稿と比較する"}
          </span>
          <span className="text-xs text-al-gray-400">
            サンプル：カフェ巡り朝ルーティン vs 朝ルーティン『5分で外出』
          </span>
        </button>
        {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  const { mine, reference } = result.pair;

  return (
    <div>
      <p className="max-w-xl text-sm text-al-gray-500">
        自分の投稿と参考にしたい投稿を項目別に比較し、どこが違うのかを可視化します。
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {[mine, reference].map((v) => (
          <div key={v.id} className="overflow-hidden rounded-2xl border border-al-gray-200">
            <div
              className="flex h-24 items-end p-3"
              style={{
                background: `linear-gradient(135deg, ${v.thumbnailFrom}, ${v.thumbnailTo})`,
              }}
            >
              <span className="rounded-full bg-white/90 px-2 py-0.5 font-display text-[10px] font-bold">
                {v.label}
              </span>
            </div>
            <div className="p-3">
              <p className="font-display text-sm font-bold leading-snug">{v.title}</p>
              <p className="mt-0.5 text-xs text-al-gray-400">{v.creator}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {(Object.keys(metricLabels) as (keyof BenchmarkVideo["metrics"])[]).map((key) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-al-gray-500">
              <span>{metricLabels[key]}</span>
              <span>
                {mine.metrics[key]} / {reference.metrics[key]}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-al-gray-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-al-gray-400"
                style={{ width: `${mine.metrics[key]}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-al-pink opacity-70 mix-blend-multiply"
                style={{ width: `${reference.metrics[key]}%` }}
              />
            </div>
          </div>
        ))}
        <div className="flex gap-4 pt-1 text-xs text-al-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-al-gray-400" />
            あなたの投稿
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-al-pink" />
            参考投稿
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-2 rounded-xl bg-al-gray-50 p-4 text-sm leading-relaxed text-al-gray-600">
        <p>
          <span className="font-bold text-al-black">あなたの投稿：</span>
          {mine.note}
        </p>
        <p>
          <span className="font-bold text-al-black">参考投稿：</span>
          {reference.note}
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-al-black p-5 text-white">
        <p className="font-display text-xs font-bold tracking-widest text-al-lime">
          NEXT ACTION
        </p>
        <ul className="mt-3 space-y-2">
          {result.nextActions.map((action) => (
            <li key={action} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-al-lime" />
              {action}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => setResult(null)}
        className="mt-6 text-sm font-bold text-al-purple hover:underline"
      >
        別の投稿と比較する
      </button>
    </div>
  );
}
