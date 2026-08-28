// TRENDページを実データで更新する共通ロジック。
// npm run sync-trends（手動CLI）と /api/cron/sync-trends（Vercel Cron）の両方から呼ばれる。
//
// YouTube Data API から実際に再生数が伸びている動画を取得し、Geminiでカテゴリー分け・
// 注目理由・使い方の解説文（音源の場合は歌手名・曲名も）を生成してTrendテーブルに反映する
// （source=YOUTUBE）。TikTok/Instagramは公式のトレンド発見APIが一般開発者に提供されていない
// ため対象外。詳細は src/lib/sources/tiktok.ts, src/lib/sources/instagram.ts のコメントを参照。
//
// TikTokカテゴリーのみ、「1週間以内投稿・10万回再生以上」というトレンド判定の定量条件を
// 満たした動画だけをトレンド扱いにする（下記TIKTOK_TREND_*参照）。該当なしになりやすいため
// 複数クエリ（TIKTOK_EXTRA_QUERIES）で候補を集めてから閾値判定する。ただし再生数自体は
// TikTok本体の数値ではなく、YouTube上でTikTok関連コンテンツを検索した際の実再生数を
// 代用している点に注意（TrendCard上は引き続きsource=YOUTUBEとして正直に表示される）。
//
// 音源カテゴリーは「メドレー」「何曲歌える」等の複数曲まとめコンテンツを除外し、
// 単一の曲・アーティストを扱った動画を優先する（COMPILATION_TITLE_PATTERN参照）。

import type { PrismaClient } from "@/generated/prisma/client";
import { fetchTrendingVideos, formatViewCount } from "@/lib/sources/youtube";
import { summarizeYoutubeTrend, extractSongInfo, analyzeVideoFromUrl } from "@/lib/ai";
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
  音源: "TikTok 新曲 ダンス 振り付け",
  ファッション: "コーデ 配色 ファッション",
  メイク: "メイク 時短 やり方",
  企画: "TikTok 企画 撮り方",
  TikTok: "TikTok 流行 チャレンジ",
  Instagram: "Instagram リール 人気",
};

// TikTokカテゴリーは1クエリだと該当なしになりやすいため、複数の切り口で検索して候補を集める。
const TIKTOK_EXTRA_QUERIES = ["TikTok バズった 動画", "TikTok トレンド 企画"];

// 音源カテゴリーで「メドレー」「クイズ」等の複数曲まとめコンテンツを弾き、
// 単一の曲・アーティストを扱った動画だけを候補として残すための簡易フィルター。
const COMPILATION_TITLE_PATTERN = /メドレー|全部|何曲|クイズ|ランキング|まとめ|nonstop|medley/i;

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

// TikTokカテゴリーの「トレンド扱い」の定義：1週間以内に投稿され、10万回再生以上。
// TikTok自体の実再生数ではなく、YouTube上でTikTok関連コンテンツを検索した際の実再生数を
// 代用値として使う（TikTok公式の再生数取得手段が一般開発者に提供されていないため）。
const TIKTOK_TREND_WINDOW_DAYS = 7;
const TIKTOK_TREND_MIN_VIEWS = 100_000;
// 7日以内・10万再生以上の候補を十分な数から選べるよう、検索件数を広めに取る。
const TIKTOK_CANDIDATE_SIZE = 20;

export function trendSyncReady(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY && process.env.GEMINI_API_KEY);
}

export async function syncTrends(prisma: PrismaClient): Promise<SyncTrendsResult> {
  const result: SyncTrendsResult = { created: 0, updated: 0, skipped: 0, log: [] };
  const weekOf = getWeekStart(new Date());

  for (const category of TREND_CATEGORIES) {
    const query = CATEGORY_QUERY[category];
    try {
      let videos;

      if (category === "TikTok") {
        // 複数クエリで候補を集め、動画IDで重複を除いてから閾値でフィルタする。
        const queries = [query, ...TIKTOK_EXTRA_QUERIES];
        const candidateLists = await Promise.all(
          queries.map((q) => fetchTrendingVideos(q, TIKTOK_CANDIDATE_SIZE, TIKTOK_TREND_WINDOW_DAYS))
        );
        const seen = new Set<string>();
        const candidates = candidateLists.flat().filter((v) => {
          if (seen.has(v.videoId)) return false;
          seen.add(v.videoId);
          return true;
        });
        videos = candidates
          .filter((v) => v.viewCount >= TIKTOK_TREND_MIN_VIEWS)
          .sort((a, b) => b.viewCount - a.viewCount)
          .slice(0, RANKING_SIZE);
        if (videos.length === 0) {
          result.skipped++;
          result.log.push(
            `[${category}] トレンド条件（${TIKTOK_TREND_WINDOW_DAYS}日以内・${TIKTOK_TREND_MIN_VIEWS.toLocaleString()}回再生以上）を満たす動画なし（${queries.length}クエリ試行）`
          );
          continue;
        }
      } else if (category === "音源") {
        // メドレー・クイズ系を除外し、単一の曲・アーティストを扱った動画を優先する。
        const candidates = await fetchTrendingVideos(query, TIKTOK_CANDIDATE_SIZE);
        const singleSongCandidates = candidates.filter((v) => !COMPILATION_TITLE_PATTERN.test(v.title));
        videos = (singleSongCandidates.length > 0 ? singleSongCandidates : candidates).slice(
          0,
          RANKING_SIZE
        );
      } else {
        videos = await fetchTrendingVideos(query, RANKING_SIZE);
      }

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

      // 実際に動画を見て画角・カット割り・編集のポイントを分析する（重い呼び出しのため
      // カテゴリー代表の1本のみ）。失敗してもトレンド自体の更新は続行する。
      let videoAnalysis: string | null = null;
      try {
        const analysis = await analyzeVideoFromUrl(video.url);
        videoAnalysis = analysis.overallComment || null;
      } catch (analysisErr) {
        result.log.push(
          `[${category}] 動画分析に失敗しました（トレンド自体は更新します）: ${analysisErr instanceof Error ? analysisErr.message : String(analysisErr)}`
        );
      }

      const [from, to] = CATEGORY_GRADIENT[category];
      const existing = await prisma.trend.findFirst({ where: { sourceUrl: video.url } });

      // TikTok枠は再生数・投稿日の定量条件で選んだ動画なので、AIによる内容ベースの
      // カテゴリー再分類（例：SNSへの吸収）を上書きし、確実にTikTokカテゴリーに残す。
      const data = {
        category: category === "TikTok" ? "TikTok" : summary.category,
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
        searchKeywords: summary.searchKeywords,
        videoAnalysis,
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
