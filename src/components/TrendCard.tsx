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
      className={`flex flex-col overflow-hidden rounded-2xl border border-al-gray-200 bg-white ${className}`}
    >
      <div
        className="relative flex h-32 items-end p-4"
        style={{
          background: `linear-gradient(135deg, ${trend.thumbnailFrom}, ${trend.thumbnailTo})`,
        }}
      >
        <span className="rounded-full bg-white/90 px-2.5 py-1 font-display text-xs font-bold text-al-black">
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
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </article>
  );
}
