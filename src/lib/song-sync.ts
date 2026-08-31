// /songs（音源の週間ランキング）を実データで更新する共通ロジック。
// npm run sync-songs（手動CLI）と /api/cron/sync-songs（Vercel Cron）の両方から呼ばれる。
// TREND側の「音源」カテゴリーはこちらに一本化し廃止した（src/lib/trend-sync.ts参照）。
//
// YouTube Data API で「今伸びている音源関連動画」を複数の切り口で検索し、Geminiで
// 曲名・歌手名・主な使用用途（踊ってみた／ネタ系／Vlog系／その他）を動画タイトル・概要から
// 読み取れる範囲で抽出する。読み取れない・曲を特定できない動画はランキングに含めない
// （実在しない曲名・アーティスト名を捏造しないため）。
//
// 「使用用途」はAIによる解釈的な判断（whyHot等と同様の位置づけ）であり、実際にその曲が
// TikTok上でどう使われているかの統計データではない点に注意。

import type { PrismaClient } from "@/generated/prisma/client";
import { fetchTrendingVideos, formatViewCount } from "@/lib/sources/youtube";
import { classifySongTrend } from "@/lib/ai";
import { getWeekStart } from "@/lib/week";

// 複数の切り口で検索して候補の幅を広げる（1クエリだと同じような曲に偏り、
// TOP50に対して候補数が不足しやすいため）。
const SONG_QUERIES = [
  "TikTok 新曲 ダンス 振り付け",
  "TikTok 流行り 曲",
  "TikTok 人気 音源",
  "TikTok バズった 曲",
  "TikTok サビ ダンス 曲",
  "TikTok 曲 有名 話題",
  "Instagram リール 人気 曲",
  "Instagram リール BGM 人気",
];

// 「メドレー」「何曲歌える」等の複数曲まとめコンテンツを除外し、
// 単一の曲・アーティストを扱った動画だけを候補として残すための簡易フィルター。
const COMPILATION_TITLE_PATTERN = /メドレー|全部|何曲|クイズ|ランキング|まとめ|nonstop|medley/i;

// search.listのクォータ消費はmaxResultsの値によらずクエリ単体で一定のため、
// クエリ数を増やすよりmaxResultsを上げる方がクォータ効率がよい（上限50）。
// 曲の重複判定用キー。表記ゆれ（全角/半角、引用符の種類、feat./コラボ表記など）を
// 吸収しないと、同じ曲が別動画から複数回抽出された際に別の曲として重複登録されてしまう。
function normalizeSongKey(artistName: string, songTitle: string): string {
  const normalize = (s: string) =>
    s
      .normalize("NFKC")
      .replace(/['’‘`]/g, "'")
      .replace(/[-–—]/g, "-")
      .trim()
      .toLowerCase();
  // アーティスト名は「主要アーティスト」だけをキーに使う（コラボ表記の有無で
  // 重複判定がぶれないように、feat./コラボ区切りの先頭だけを見る）。
  const primaryArtist = artistName.split(/[,、&/]|\sfeat\.?\s|\sft\.?\s/i)[0] ?? artistName;
  return `${normalize(primaryArtist)}|${normalize(songTitle)}`;
}

const CANDIDATE_SIZE_PER_QUERY = 45;
const PUBLISHED_AFTER_DAYS = 45;

// ランキングに残す件数（週間ランキングTOP50）。
export const SONG_RANKING_SIZE = 50;

// AI呼び出し回数の上限。1回あたり約4.5秒のレート制限があるため、Vercel Cronの実行時間
// 上限（300秒）に収まるよう安全マージンを取って設定している（60回 × 4.5秒 ≒ 270秒）。
const MAX_AI_CALLS = 60;

export interface SyncSongsResult {
  created: number;
  updated: number;
  skipped: number;
  log: string[];
}

export function songSyncReady(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY && process.env.GEMINI_API_KEY);
}

export async function syncSongRankings(prisma: PrismaClient): Promise<SyncSongsResult> {
  const result: SyncSongsResult = { created: 0, updated: 0, skipped: 0, log: [] };
  const weekOf = getWeekStart(new Date());

  // 複数クエリで候補を集め、動画IDで重複を除く。
  const candidateLists = await Promise.all(
    SONG_QUERIES.map((q) => fetchTrendingVideos(q, CANDIDATE_SIZE_PER_QUERY, PUBLISHED_AFTER_DAYS))
  );
  const seenVideoIds = new Set<string>();
  const candidates = candidateLists
    .flat()
    .filter((v) => {
      if (seenVideoIds.has(v.videoId)) return false;
      seenVideoIds.add(v.videoId);
      return true;
    })
    .filter((v) => !COMPILATION_TITLE_PATTERN.test(v.title))
    .sort((a, b) => b.viewCount - a.viewCount);

  if (candidates.length === 0) {
    result.log.push("該当する候補動画がありませんでした。");
    return result;
  }

  type RankedSong = {
    songTitle: string;
    artistName: string;
    youtubeUrl: string;
    usageType: string;
    thumbnailUrl: string | null;
    viewCount: number;
  };

  const ranked: RankedSong[] = [];
  const seenSongKeys = new Set<string>();
  let aiCalls = 0;
  let unresolved = 0;

  for (const video of candidates) {
    if (ranked.length >= SONG_RANKING_SIZE) break;
    if (aiCalls >= MAX_AI_CALLS) break;

    aiCalls++;
    let info;
    try {
      info = await classifySongTrend({
        videoTitle: video.title,
        videoDescription: video.description,
        channelTitle: video.channelTitle,
      });
    } catch (err) {
      result.log.push(
        `曲情報の抽出に失敗しました（スキップ）: ${err instanceof Error ? err.message : String(err)}`
      );
      continue;
    }

    if (!info.artistName || !info.songTitle) {
      unresolved++;
      continue;
    }

    const key = normalizeSongKey(info.artistName, info.songTitle);
    if (seenSongKeys.has(key)) continue;
    seenSongKeys.add(key);

    ranked.push({
      songTitle: info.songTitle,
      artistName: info.artistName,
      youtubeUrl: video.url,
      usageType: info.usageType ?? "その他",
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount,
    });
  }

  if (unresolved > 0) {
    result.log.push(`曲を特定できなかった動画: ${unresolved}件（ランキングには含めていません）`);
  }

  if (ranked.length === 0) {
    result.skipped++;
    result.log.push("曲名・アーティスト名を特定できた候補がありませんでした。");
    return result;
  }

  // 今回の件数より下位の順位が前回までのデータとして残ってしまわないよう、
  // はみ出した順位は先に削除しておく。
  await prisma.songRanking.deleteMany({
    where: { weekOf, rank: { gt: ranked.length } },
  });

  for (let i = 0; i < ranked.length; i++) {
    const song = ranked[i];
    const rank = i + 1;
    const data = {
      songTitle: song.songTitle,
      artistName: song.artistName,
      youtubeUrl: song.youtubeUrl,
      usageType: song.usageType,
      thumbnailUrl: song.thumbnailUrl,
      viewCount: song.viewCount,
      growth: formatViewCount(song.viewCount),
      fetchedAt: new Date(),
    };

    const existing = await prisma.songRanking.findUnique({
      where: { weekOf_rank: { weekOf, rank } },
    });

    if (existing) {
      await prisma.songRanking.update({ where: { id: existing.id }, data });
      result.updated++;
    } else {
      await prisma.songRanking.create({ data: { ...data, weekOf, rank } });
      result.created++;
    }
  }

  result.log.push(
    `音源ランキング${ranked.length}件を更新しました（${weekOf.toISOString().slice(0, 10)}週、AI呼び出し${aiCalls}回）`
  );

  return result;
}
