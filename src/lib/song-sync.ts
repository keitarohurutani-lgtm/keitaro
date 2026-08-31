// /songs（音源の週間ランキング）を実データで更新する共通ロジック。
// npm run sync-songs（手動CLI）と /api/cron/sync-songs（Vercel Cron）の両方から呼ばれる。
// TREND側の「音源」カテゴリーはこちらに一本化し廃止した（src/lib/trend-sync.ts参照）。
//
// 主な使用用途（踊ってみた／ネタ系／Vlog系／その他）ごとに、それぞれ専用の検索クエリで
// YouTube Data APIから候補動画を探し、Geminiで曲名・歌手名を読み取れる範囲で抽出する
// （バッチ処理で複数動画をまとめて1回のAPI呼び出しにまとめ、レート制限内で多くの候補を
// さばけるようにしている）。用途ラベルは「その用途向けに検索して見つかった動画」という
// 検索クエリの切り口そのものを根拠にしており、AIが曲の使われ方を推測しているわけではない。
// 各用途ごとに、曲名・アーティスト名を特定できた動画だけを最大20件までランキングする
// （読み取れない・特定できない動画は含めない。実在しない曲名・アーティスト名は捏造しない）。
// 順位は「検索で見つかった動画のうち何件が同じ曲だったか」（usageCount）の多い順。
// TikTok本体の使用数（「◯件の投稿」表示）を取得できるAPIは提供されていないための代用値であり、
// 実際のTikTok上の使用数そのものではない点に注意（README・UI上にもその旨を明記している）。

import type { PrismaClient } from "@/generated/prisma/client";
import { fetchTrendingVideos } from "@/lib/sources/youtube";
import { extractSongInfoBatch } from "@/lib/ai";
import { getWeekStart } from "@/lib/week";
import { SONG_USAGE_TYPES, type SongUsageType } from "@/lib/data";

// 用途ごとに、それらしい動画が見つかりやすい検索クエリを複数用意する。
// ネタ系・Vlog系・その他は、動画タイトルに使用曲名が出てこないことが多く候補が
// 少なくなりやすいため、「音源」等の限定語を外した自然な検索語も混ぜて母数を広げている。
const USAGE_QUERIES: Record<SongUsageType, string[]> = {
  踊ってみた: [
    "TikTok 新曲 ダンス 振り付け",
    "TikTok ダンス カバー 人気",
    "踊ってみた 新曲 人気",
    "TikTok 新曲 振り付け 解説",
  ],
  ネタ系: [
    "TikTok あるある",
    "TikTok コント 動画",
    "TikTokネタ 動画",
    "TikTok あるある ネタ 音源",
    "TikTok 面白い 動画 曲",
  ],
  Vlog系: [
    "TikTok Vlog",
    "Vlog BGM おすすめ 曲",
    "TikTok 日常 BGM",
    "学生 Vlog BGM",
    "TikTok Vlog BGM 人気",
  ],
  その他: [
    "TikTok 人気 音源",
    "TikTok バズった 曲",
    "TikTok 話題 曲",
    "TikTok トレンド 曲",
    "TikTok 曲 人気 2026",
  ],
};

// 「メドレー」「何曲歌える」等の複数曲まとめコンテンツを除外し、
// 単一の曲・アーティストを扱った動画だけを候補として残すための簡易フィルター。
const COMPILATION_TITLE_PATTERN = /メドレー|全部|何曲|クイズ|ランキング|まとめ|nonstop|medley/i;

// search.listのクォータ消費はmaxResultsの値によらずクエリ単体で一定のため、
// クエリ数を増やすよりmaxResultsを上げる方がクォータ効率がよい（上限50）。
const CANDIDATE_SIZE_PER_QUERY = 45;
const PUBLISHED_AFTER_DAYS = 45;

// 用途ごとのランキング件数（踊ってみた/ネタ系/Vlog系/その他 × 各20件 = 最大80件）。
export const SONGS_PER_USAGE_TYPE = 20;

// 1回のAPI呼び出しにまとめる候補数。件数を稼ぐには1件ずつ呼ぶとレート制限
// （4.5秒間隔）で時間が足りないため、まとめて渡して呼び出し回数自体を減らす。
const BATCH_SIZE = 15;
// 用途1つあたりのバッチ呼び出し上限（安全マージン）。
// 4用途 × 上限10バッチ × 約4.5秒 ≒ 180秒で、Vercel Cronの実行時間上限（300秒）に収まる。
const MAX_BATCHES_PER_TYPE = 10;

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
  const primaryArtist = artistName.split(/[,、&/]|\sfeat\.?\s|\sft\.?\s/i)[0] ?? artistName;
  return `${normalize(primaryArtist)}|${normalize(songTitle)}`;
}

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

  for (const usageType of SONG_USAGE_TYPES) {
    const queries = USAGE_QUERIES[usageType];

    const candidateLists = await Promise.all(
      queries.map((q) => fetchTrendingVideos(q, CANDIDATE_SIZE_PER_QUERY, PUBLISHED_AFTER_DAYS))
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
      result.log.push(`[${usageType}] 該当する候補動画がありませんでした。`);
      continue;
    }

    type RankedSong = {
      songTitle: string;
      artistName: string;
      youtubeUrl: string;
      thumbnailUrl: string | null;
      viewCount: number;
      usageCount: number;
    };

    // 曲ごとに「この同期で検索・分析した動画のうち何件が同じ曲だったか」を数える
    // （TikTok本体の使用数APIは提供されていないため、検索できた範囲内での出現数を代用値とする）。
    // ランキング件数を早めに打ち切らず、取得できた候補は最後まで数え切ってから
    // 出現数の多い順に並べ替える必要があるため、ループの終了条件に上位件数は使わない。
    const songMap = new Map<string, RankedSong>();
    let unresolved = 0;
    let batches = 0;

    for (
      let i = 0;
      i < candidates.length && batches < MAX_BATCHES_PER_TYPE;
      i += BATCH_SIZE
    ) {
      const batch = candidates.slice(i, i + BATCH_SIZE);
      batches++;

      const batchInput = batch.map((v) => ({
        id: v.videoId,
        videoTitle: v.title,
        videoDescription: v.description,
        channelTitle: v.channelTitle,
      }));

      let infos;
      try {
        infos = await extractSongInfoBatch(batchInput);
      } catch {
        // Geminiの無料枠は一時的な503（高負荷）が起きることがあるため、1回だけ再試行する。
        try {
          infos = await extractSongInfoBatch(batchInput);
        } catch (err) {
          result.log.push(
            `[${usageType}] 曲情報の抽出に失敗しました（このバッチはスキップ）: ${err instanceof Error ? err.message : String(err)}`
          );
          continue;
        }
      }
      const infoById = new Map(infos.map((info) => [info.id, info]));

      for (const video of batch) {
        const info = infoById.get(video.videoId);
        if (!info || !info.artistName || !info.songTitle) {
          unresolved++;
          continue;
        }
        const key = normalizeSongKey(info.artistName, info.songTitle);
        const existing = songMap.get(key);
        if (existing) {
          existing.usageCount++;
          // 代表動画（サムネイル・リンク）は、その中で最も再生数が多いものを採用する。
          if (video.viewCount > existing.viewCount) {
            existing.viewCount = video.viewCount;
            existing.youtubeUrl = video.url;
            existing.thumbnailUrl = video.thumbnailUrl;
          }
        } else {
          songMap.set(key, {
            songTitle: info.songTitle,
            artistName: info.artistName,
            youtubeUrl: video.url,
            thumbnailUrl: video.thumbnailUrl,
            viewCount: video.viewCount,
            usageCount: 1,
          });
        }
      }
    }

    if (unresolved > 0) {
      result.log.push(`[${usageType}] 曲を特定できなかった動画: ${unresolved}件（ランキングには含めていません）`);
    }

    // 出現数（usageCount）が多い順、同数なら代表動画の再生数が多い順に並べ、上位N件を採用する。
    const ranked = Array.from(songMap.values())
      .sort((a, b) => b.usageCount - a.usageCount || b.viewCount - a.viewCount)
      .slice(0, SONGS_PER_USAGE_TYPE);

    if (ranked.length === 0) {
      result.skipped++;
      result.log.push(`[${usageType}] 曲名・アーティスト名を特定できた候補がありませんでした。`);
      continue;
    }

    // 今回の件数より下位の順位が前回までのデータとして残ってしまわないよう、
    // はみ出した順位は先に削除しておく。
    await prisma.songRanking.deleteMany({
      where: { weekOf, usageType, rank: { gt: ranked.length } },
    });

    for (let i = 0; i < ranked.length; i++) {
      const song = ranked[i];
      const rank = i + 1;
      const data = {
        songTitle: song.songTitle,
        artistName: song.artistName,
        youtubeUrl: song.youtubeUrl,
        thumbnailUrl: song.thumbnailUrl,
        viewCount: song.viewCount,
        usageCount: song.usageCount,
        growth: `${song.usageCount}本の動画で使用`,
        fetchedAt: new Date(),
      };

      const existing = await prisma.songRanking.findUnique({
        where: { weekOf_usageType_rank: { weekOf, usageType, rank } },
      });

      if (existing) {
        await prisma.songRanking.update({ where: { id: existing.id }, data });
        result.updated++;
      } else {
        await prisma.songRanking.create({ data: { ...data, weekOf, usageType, rank } });
        result.created++;
      }
    }

    result.log.push(`[${usageType}] ${ranked.length}件のランキングを更新しました（バッチ呼び出し${batches}回）`);
  }

  return result;
}
