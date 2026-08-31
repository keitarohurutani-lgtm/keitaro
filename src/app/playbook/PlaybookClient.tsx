"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Trend } from "@/generated/prisma/client";
import { CATEGORIES, isCategory } from "@/lib/data";
import { PLAYBOOK_IDEAS } from "@/lib/playbook";
import CategoryTag from "@/components/CategoryTag";
import { toast } from "@/lib/toast";

async function copyIdea(title: string, steps: readonly string[]) {
  const text = [title, ...steps.map((s, i) => `${i + 1}. ${s}`)].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    toast(`「${title}」をコピーしました`);
  } catch {
    toast("コピーできませんでした", "error");
  }
}

function CurrentTrendBanner({ trend }: { trend: Trend }) {
  return (
    <div className="al-flyer-card mt-4 flex flex-col gap-1 rounded-xl border-2 border-al-black bg-al-gray-50 p-4">
      <div className="flex items-center gap-2">
        <span className="al-sticker rounded-full px-2.5 py-1 font-display text-[11px] font-bold text-al-black">
          今のトレンド
        </span>
        <span className="text-[11px] font-bold text-al-gray-400">{trend.growth}</span>
      </div>
      <p className="font-display text-sm font-bold leading-snug">{trend.name}</p>
      {(trend.artistName || trend.songTitle) && (
        <p className="text-xs font-bold text-al-purple">
          🎵 {trend.artistName ?? "アーティスト不明"}
          {trend.songTitle ? ` - ${trend.songTitle}` : ""}
        </p>
      )}
      <p className="text-xs leading-relaxed text-al-gray-500">
        今このジャンルで伸びているのはこの投稿です。下のネタと組み合わせて、自分ならどう真似できるか考えてみましょう。
      </p>
      {trend.sourceUrl && (
        <a
          href={trend.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-bold text-al-blue hover:underline"
        >
          元動画を見る →
        </a>
      )}
    </div>
  );
}

export default function PlaybookClient({
  currentTrends,
  initialFavoriteIds,
}: {
  currentTrends: Record<string, Trend>;
  initialFavoriteIds: string[];
}) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const initialActive = categoryParam && isCategory(categoryParam) ? categoryParam : "すべて";

  const [active, setActive] = useState<"すべて" | (typeof CATEGORIES)[number]>(initialActive);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(initialFavoriteIds));
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const toggleFavorite = async (id: string) => {
    const wasFavorited = favoriteIds.has(id);

    // 通信待ちで押した感触が遅れないよう、先に見た目だけ切り替えてから送信する。
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      const res = await fetch(`/api/playbook/${id}/favorite`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "お気に入りの更新に失敗しました。");
      toast(json.favorited ? "お気に入りに追加しました" : "お気に入りを解除しました");
    } catch (err) {
      // 失敗したら見た目を元に戻す
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.add(id);
        else next.delete(id);
        return next;
      });
      toast(err instanceof Error ? err.message : "お気に入りの更新に失敗しました。", "error");
    }
  };

  const categoryFiltered =
    active === "すべて" ? PLAYBOOK_IDEAS : PLAYBOOK_IDEAS.filter((idea) => idea.category === active);
  const visible = favoritesOnly ? categoryFiltered.filter((idea) => favoriteIds.has(idea.id)) : categoryFiltered;

  const activeTrend = active !== "すべて" ? currentTrends[active] : undefined;

  return (
    <div>
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
        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          className={`shrink-0 rounded-full px-4 py-2 font-display text-sm font-bold transition-colors ${
            favoritesOnly
              ? "bg-al-pink text-white"
              : "bg-al-gray-100 text-al-gray-600 hover:bg-al-gray-200"
          }`}
        >
          ★ お気に入り（{favoriteIds.size}）
        </button>
      </div>

      {activeTrend && <CurrentTrendBanner trend={activeTrend} />}

      <p className="mt-4 text-xs text-al-gray-400">{visible.length}件のネタ（タップでコピーできます）</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((idea) => {
          const favorited = favoriteIds.has(idea.id);
          return (
            <article
              key={idea.id}
              className="al-flyer-card flex flex-col gap-2 rounded-xl bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <CategoryTag category={idea.category} />
                <button
                  type="button"
                  onClick={() => toggleFavorite(idea.id)}
                  aria-label={favorited ? "お気に入りから外す" : "お気に入りに追加"}
                  aria-pressed={favorited}
                  className={`text-lg leading-none transition-transform hover:scale-110 ${
                    favorited ? "text-al-pink" : "text-al-gray-300"
                  }`}
                >
                  {favorited ? "★" : "☆"}
                </button>
              </div>
              <h3 className="font-display text-base font-bold leading-snug">{idea.title}</h3>
              <p className="text-sm leading-relaxed text-al-gray-600">{idea.hook}</p>
              <ol className="mt-1 space-y-1.5 border-t border-al-gray-100 pt-2">
                {idea.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-al-gray-500">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-al-gray-100 font-display text-[10px] font-bold text-al-gray-500">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => copyIdea(idea.title, idea.steps)}
                className="mt-2 self-start text-xs font-bold text-al-purple hover:underline"
              >
                このネタをコピーする
              </button>
            </article>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-al-gray-400">
            {favoritesOnly
              ? "お気に入りのネタはまだありません。☆をタップして追加してみましょう。"
              : "このカテゴリーのネタは準備中です。"}
          </p>
        )}
      </div>
    </div>
  );
}
