import type { ReactNode } from "react";
import type { Trend } from "@/generated/prisma/client";
import CategoryTag from "./CategoryTag";

export default function TrendCard({
  trend,
  className = "w-72 shrink-0",
  footer,
}: {
  trend: Trend;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <article
      className={`al-flyer-card relative flex flex-col overflow-hidden rounded-xl bg-white ${className}`}
    >
      <div
        className="relative flex h-32 items-start justify-end p-3"
        style={{
          background: `linear-gradient(135deg, ${trend.thumbnailFrom}, ${trend.thumbnailTo})`,
        }}
      >
        <span className="al-sticker rounded-full px-2.5 py-1 font-display text-xs font-bold text-al-black">
          {trend.growth}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <CategoryTag category={trend.category} />
          {trend.source !== "SEED" && (
            <span className="text-[10px] font-bold text-al-gray-400">
              {trend.source === "YOUTUBE" ? "YouTube実データ" : trend.source}
            </span>
          )}
        </div>
        <h3 className="font-display text-base font-bold leading-snug">{trend.name}</h3>
        {(trend.artistName || trend.songTitle) && (
          <p className="font-display text-sm font-bold text-al-purple">
            🎵 {trend.artistName ?? "アーティスト不明"}
            {trend.songTitle ? ` - ${trend.songTitle}` : ""}
          </p>
        )}
        <p className="text-sm leading-relaxed text-al-gray-600">{trend.description}</p>
        <div className="mt-1 space-y-1 border-t border-al-gray-100 pt-2 text-xs leading-relaxed text-al-gray-500">
          <p>
            <span className="font-bold text-al-black">なぜ注目？ </span>
            {trend.whyHot}
          </p>
          <p>
            <span className="font-bold text-al-black">使い方 </span>
            {trend.howToUse}
          </p>
        </div>
        {trend.sourceUrl && (
          <a
            href={trend.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-al-blue hover:underline"
          >
            参考：{trend.sourceLabel ?? "元動画"}を見る →
          </a>
        )}
        {trend.searchKeywords.length > 0 && (
          <div className="mt-1 border-t border-al-gray-100 pt-2">
            <p className="text-[11px] font-bold text-al-gray-400">
              この検索キーワードで参考投稿を探せます
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {trend.searchKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-al-gray-50 px-2 py-0.5 text-[11px] font-bold text-al-gray-600"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </article>
  );
}
