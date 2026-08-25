// TRENDページを実データで更新する共通ロジック。
// npm run sync-trends（手動CLI）と instrumentation.ts（定期自動実行）の両方から呼ばれる。
//
// YouTube Data API から実際に再生数が伸びている動画を取得し、Geminiでカテゴリー分け・
// 注目理由・使い方の解説文（音源の場合は歌手名・曲名も）を生成してTrendテーブルに反映する
// （source=YOUTUBE）。TikTok/Instagramは公式のトレンド発見APIが一般開発者に提供されていない
// ため対象外。詳細は src/lib/sources/tiktok.ts, src/lib/sources/instagram.ts のコメントを参照。

import type { PrismaClient } from "@/generated/prisma/client";
import { fetchTrendingVideos, formatViewCount } from "@/lib/sources/youtube";
import { summarizeYoutubeTrend, extractSongInfo } from "@/lib/ai";
import { getWeekStart } from "@/lib/week";

export const TREND_CATEGORIES = [
  "SNS",
  "音源",
  "ファッション",
  "メイク",
  "企画",
  "TikTok",
  "Instagram",
] as const;

const CATEGORY_QUERY: Record<(typeof TREND_CATEGORIES)[number], string> = {
  SNS: "SNS 投稿 バズる コツ",
  音源: "TikTok 音源 ダンス 流行",
  ファッション: "コーデ 配色 ファッション",
  メイク: "メイク 時短 やり方",
  企画: "TikTok 企画 撮り方",
  TikTok: "TikTok 流行 チャレンジ",
  Instagram: "Instagram リール 人気",
};

const CATEGORY_GRADIENT: Record<(typeof TREND_CATEGORIES)[number], [string, string]> = {
  SNS: ["#0B0B0C", "#2F7DFF"],
  音源: ["#7C5CFF", "#D4FF3D"],
  ファッション: ["#0B0B0C", "#FF2E8B"],
  メイク: ["#FF2E8B", "#0B0B0C"],
  企画: ["#0B0B0C", "#7C5CFF"],
  TikTok: ["#2F7DFF", "#7C5CFF"],
  Instagram: ["#D4FF3D", "#0B0B0C"],
};

export interface SyncTrendsResult {
  created: number;
  updated: number;
  skipped: number;
  log: string[];
}

// 週間ランキングに残す件数（カテゴリーごとに再生数上位N件）。
const RANKING_SIZE = 5;

export function trendSyncReady(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY && process.env.GEMINI_API_KEY);
}

export async function syncTrends(prisma: PrismaClient): Promise<SyncTrendsResult> {
  const result: SyncTrendsResult = { created: 0, updated: 0, skipped: 0, log: [] };
  const weekOf = getWeekStart(new Date());

  for (const category of TREND_CATEGORIES) {
    const query = CATEGORY_QUERY[category];
    try {
      const videos = await fetchTrendingVideos(query, RANKING_SIZE);
      const video = videos[0];
      if (!video) {
        result.skipped++;
        result.log.push(`[${category}] 該当動画なし（クエリ: ${query}）`);
        continue;
      }

      const summary = await summarizeYoutubeTrend({
        videoTitle: video.title,
        videoDescription: video.description,
        channelTitle: video.channelTitle,
        categories: TREND_CATEGORIES,
      });

      const [from, to] = CATEGORY_GRADIENT[category];
      const existing = await prisma.trend.findFirst({ where: { sourceUrl: video.url } });

      const data = {
        category: summary.category,
        name: video.title.slice(0, 60),
        description: summary.description,
        whyHot: summary.whyHot,
        howToUse: summary.howToUse,
        growth: formatViewCount(video.viewCount),
        thumbnailFrom: from,
        thumbnailTo: to,
        source: "YOUTUBE" as const,
        sourceLabel: video.channelTitle,
        sourceUrl: video.url,
        artistName: summary.artistName,
        songTitle: summary.songTitle,
        fetchedAt: new Date(),
      };

      if (existing) {
        await prisma.trend.update({ where: { id: existing.id }, data });
        result.updated++;
        result.log.push(`[${category}] 更新: ${data.name}`);
      } else {
        await prisma.trend.create({ data });
        result.created++;
        result.log.push(`[${category}] 追加: ${data.name}`);
      }

      try {
        for (let i = 0; i < videos.length; i++) {
          const rankVideo = videos[i];
          const rank = i + 1;

          // 1位はsummarizeYoutubeTrendの結果を流用し、音源の2〜5位のみ軽量抽出を追加で呼ぶ。
          let artistName: string | null = null;
          let songTitle: string | null = null;
          if (category === "音源") {
            if (i === 0) {
              artistName = summary.artistName;
              songTitle = summary.songTitle;
            } else {
              const songInfo = await extractSongInfo({
                videoTitle: rankVideo.title,
                channelTitle: rankVideo.channelTitle,
              });
              artistName = songInfo.artistName;
              songTitle = songInfo.songTitle;
            }
          }

          await prisma.trendRanking.upsert({
            where: { category_weekOf_rank: { category, weekOf, rank } },
            update: {
              title: rankVideo.title.slice(0, 80),
              channelTitle: rankVideo.channelTitle,
              artistName,
              songTitle,
              viewCount: rankVideo.viewCount,
              growth: formatViewCount(rankVideo.viewCount),
              thumbnailUrl: rankVideo.thumbnailUrl,
              sourceUrl: rankVideo.url,
              publishedAt: new Date(rankVideo.publishedAt),
              fetchedAt: new Date(),
            },
            create: {
              category,
              weekOf,
              rank,
              title: rankVideo.title.slice(0, 80),
              channelTitle: rankVideo.channelTitle,
              artistName,
              songTitle,
              viewCount: rankVideo.viewCount,
              growth: formatViewCount(rankVideo.viewCount),
              thumbnailUrl: rankVideo.thumbnailUrl,
              sourceUrl: rankVideo.url,
              publishedAt: new Date(rankVideo.publishedAt),
            },
          });
        }
        result.log.push(`[${category}] 週間ランキング${videos.length}件を更新: ${weekOf.toISOString().slice(0, 10)}週`);
      } catch (rankErr) {
        result.log.push(
          `[${category}] 週間ランキングの更新に失敗しました: ${rankErr instanceof Error ? rankErr.message : String(rankErr)}`
        );
      }
    } catch (err) {
      result.skipped++;
      result.log.push(
        `[${category}] 取得に失敗しました: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}
