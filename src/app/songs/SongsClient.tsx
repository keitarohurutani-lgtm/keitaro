"use client";

import { useState } from "react";
import type { SongRanking } from "@/generated/prisma/client";
import { SONG_USAGE_TYPES } from "@/lib/data";

const USAGE_ACCENT: Record<string, string> = {
  踊ってみた: "bg-al-purple",
  ネタ系: "bg-al-pink",
  Vlog系: "bg-al-blue",
  その他: "bg-al-gray-500",
};

export default function SongsClient({ songs }: { songs: SongRanking[] }) {
  const [active, setActive] = useState<"すべて" | (typeof SONG_USAGE_TYPES)[number]>("すべて");

  const visible = active === "すべて" ? songs : songs.filter((s) => s.usageType === active);

  if (songs.length === 0) {
    return (
      <p className="mt-10 rounded-2xl border border-al-gray-200 p-6 text-center text-sm text-al-gray-400">
        今週の音源ランキングはまだ準備中です。
      </p>
    );
  }

  return (
    <div>
      <div className="al-rail mt-6 flex gap-2 overflow-x-auto pb-2">
        {(["すべて", ...SONG_USAGE_TYPES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`shrink-0 rounded-full px-4 py-2 font-display text-sm font-bold transition-colors ${
              active === t
                ? "bg-al-black text-white"
                : "bg-al-gray-100 text-al-gray-600 hover:bg-al-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-al-gray-400">{visible.length}件</p>

      <ol className="mt-4 space-y-3">
        {visible.map((song) => (
          <li
            key={song.id}
            className="al-flyer-card flex items-center gap-4 rounded-2xl p-4"
          >
            <span className="al-sticker flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold">
              {song.rank}
            </span>
            {song.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={song.thumbnailUrl}
                alt={song.songTitle}
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-display text-sm font-bold">{song.songTitle}</p>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide text-white ${
                    USAGE_ACCENT[song.usageType] ?? "bg-al-gray-500"
                  }`}
                >
                  {song.usageType}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs font-bold text-al-purple">
                🎵 {song.artistName}
              </p>
              <p className="mt-0.5 text-xs text-al-gray-500">{song.growth}</p>
            </div>
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-bold text-al-blue hover:underline"
            >
              MV/音源を見る →
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
