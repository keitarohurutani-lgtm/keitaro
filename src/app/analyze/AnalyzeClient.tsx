"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

type Cut = {
  label: string;
  timestamp: string;
  score: "◎" | "○" | "△";
  comment: string;
};

type PostCheckResult =
  | {
      platform: "youtube";
      videoUrl: string;
      thumbnailUrl: string | null;
      analysis: { videoTitle: string; overallComment: string; cuts: Cut[] };
    }
  | {
      platform: "tiktok";
      videoUrl: string;
      oembed: { title: string; authorName: string; authorUrl: string; embedHtml: string };
    };

export default function AnalyzeClient() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-blue">ANALYZE</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">あなたの動画をチェック</h1>

      <div className="mt-8">
        <PostCheckPanel />
      </div>
    </div>
  );
}

function UrlInputNote() {
  return (
    <p className="mt-2 text-xs text-al-gray-400">
      YouTubeは動画を見て詳しく分析します。TikTokは動画の表示のみ対応（AI分析はできません）。Instagramはまだ対応していません。
    </p>
  );
}

// TikTokの埋め込みHTML（公式oEmbedのblockquote）は、このスクリプトが読み込まれて
// 初めて実際のプレーヤーとして描画される。新しいoEmbedを表示するたびに再実行させるため、
// 毎回スクリプトタグを追加し直す（TikTok公式の埋め込み方式）。
function TikTokEmbedScript({ embedHtml }: { embedHtml: string }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [embedHtml]);
  return null;
}

function PostCheckPanel() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<PostCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!url.trim()) {
      setError("動画のリンクを入力してください。");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/post-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "分析に失敗しました。");
      setResult(json);
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
        自分の動画のリンクを貼ると、AIが最初から最後まで見て、場面ごとに画角・カット割り・編集のポイントをチェックします。
      </p>

      {!result ? (
        <div className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 rounded-xl border border-al-gray-200 px-4 py-3 text-sm outline-none focus:border-al-black"
            />
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="shrink-0 rounded-xl bg-al-black px-6 py-3 font-display text-sm font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? "分析中です…" : "この動画を分析する"}
            </button>
          </div>
          <UrlInputNote />
        </div>
      ) : result.platform === "tiktok" ? (
        <div className="mt-6">
          <div className="rounded-xl bg-al-gray-50 px-4 py-3 text-xs leading-relaxed text-al-gray-600">
            TikTokの動画はここに表示できますが、AIによる画角・編集の分析には対応していません（詳しく分析したい場合はYouTubeのリンクをお使いください）。
          </div>
          <TikTokEmbedScript embedHtml={result.oembed.embedHtml} />
          <div
            className="mt-4 overflow-hidden rounded-2xl"
            dangerouslySetInnerHTML={{ __html: result.oembed.embedHtml }}
          />
          <p className="mt-3 text-xs text-al-gray-500">投稿者：{result.oembed.authorName}</p>
          <button
            onClick={() => {
              setResult(null);
              setUrl("");
            }}
            className="mt-6 text-sm font-bold text-al-purple hover:underline"
          >
            別の動画を分析する
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-al-gray-200">
            {result.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.thumbnailUrl}
                alt={result.analysis.videoTitle}
                className="h-40 w-full object-cover"
              />
            )}
            <div className="p-3">
              <p className="font-display text-sm font-bold leading-snug">
                {result.analysis.videoTitle}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-al-gray-50 px-4 py-3 text-xs leading-relaxed text-al-gray-600">
            ⚠️ AIによる参考分析です。100%正確ではありません。投稿改善のヒントとしてご活用ください。
          </div>

          <p className="mt-4 text-sm leading-relaxed text-al-gray-600">
            {result.analysis.overallComment}
          </p>

          <div className="mt-6 space-y-3">
            {result.analysis.cuts.map((cut, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-al-gray-200 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-al-black font-display text-sm font-bold text-white">
                  {i + 1}
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
            onClick={() => {
              setResult(null);
              setUrl("");
            }}
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
