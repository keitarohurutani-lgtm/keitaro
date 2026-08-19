// 実データでTRENDページを更新するスクリプト。
// YouTube Data API から実際に再生数が伸びている動画を取得し、Geminiでカテゴリー分け・
// 注目理由・使い方の解説文を生成してTrendテーブルに反映する（source=YOUTUBE）。
//
// 使い方: npm run sync-trends
// 必要な環境変数: YOUTUBE_API_KEY, GEMINI_API_KEY（.env.local に設定）
//
// TikTok/Instagramは公式のトレンド発見APIが一般開発者に提供されていないため対象外。
// 詳細は src/lib/sources/tiktok.ts, src/lib/sources/instagram.ts のコメントを参照。

import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { fetchTrendingVideos, formatViewCount } from "../src/lib/sources/youtube";
import { summarizeYoutubeTrend } from "../src/lib/ai";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const CATEGORIES = ["SNS", "音源", "ファッション", "メイク", "企画", "TikTok", "Instagram"] as const;

const CATEGORY_QUERY: Record<(typeof CATEGORIES)[number], string> = {
  SNS: "SNS 投稿 バズる コツ",
  音源: "TikTok 音源 ダンス 流行",
  ファッション: "コーデ 配色 ファッション",
  メイク: "メイク 時短 やり方",
  企画: "TikTok 企画 撮り方",
  TikTok: "TikTok 流行 チャレンジ",
  Instagram: "Instagram リール 人気",
};

const CATEGORY_GRADIENT: Record<(typeof CATEGORIES)[number], [string, string]> = {
  SNS: ["#0B0B0C", "#2F7DFF"],
  音源: ["#7C5CFF", "#D4FF3D"],
  ファッション: ["#0B0B0C", "#FF2E8B"],
  メイク: ["#FF2E8B", "#0B0B0C"],
  企画: ["#0B0B0C", "#7C5CFF"],
  TikTok: ["#2F7DFF", "#7C5CFF"],
  Instagram: ["#D4FF3D", "#0B0B0C"],
};

async function main() {
  if (!process.env.YOUTUBE_API_KEY) {
    console.error(
      "YOUTUBE_API_KEY が未設定です。.env.local.example を参考に .env.local へ設定してください。"
    );
    process.exitCode = 1;
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "GEMINI_API_KEY が未設定です。.env.local.example を参考に .env.local へ設定してください。"
    );
    process.exitCode = 1;
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const seedCategory of CATEGORIES) {
    const query = CATEGORY_QUERY[seedCategory];
    try {
      const videos = await fetchTrendingVideos(query, 1);
      const video = videos[0];
      if (!video) {
        console.log(`[${seedCategory}] 該当動画なし（クエリ: ${query}）`);
        skipped++;
        continue;
      }

      const summary = await summarizeYoutubeTrend({
        videoTitle: video.title,
        videoDescription: video.description,
        channelTitle: video.channelTitle,
        categories: CATEGORIES,
      });

      const [from, to] = CATEGORY_GRADIENT[seedCategory];
      const existing = await prisma.trend.findFirst({
        where: { sourceUrl: video.url },
      });

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
        fetchedAt: new Date(),
      };

      if (existing) {
        await prisma.trend.update({ where: { id: existing.id }, data });
        updated++;
        console.log(`[${seedCategory}] 更新: ${data.name}`);
      } else {
        await prisma.trend.create({ data });
        created++;
        console.log(`[${seedCategory}] 追加: ${data.name}`);
      }
    } catch (err) {
      console.error(`[${seedCategory}] 取得に失敗しました:`, err instanceof Error ? err.message : err);
      skipped++;
    }
  }

  console.log(`\n完了: 追加${created}件 / 更新${updated}件 / スキップ${skipped}件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
