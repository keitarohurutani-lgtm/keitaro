// TRENDページを実データで更新する手動CLIスクリプト。
// 実際のロジックは src/lib/trend-sync.ts を参照（定期自動実行と共通）。
//
// 使い方: npm run sync-trends
// 必要な環境変数: YOUTUBE_API_KEY, GEMINI_API_KEY（.env.local に設定）

// dotenv/config はデフォルトで .env しか読まないため、.env.local（APIキー等）を明示的に読み込む。
// Next.js本体は両方を自動で読むが、このCLIスクリプトはNext.jsの外で動くため自前で読む必要がある。
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local" });

import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import { syncTrends, trendSyncReady } from "../src/lib/trend-sync";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!trendSyncReady()) {
    console.error(
      "YOUTUBE_API_KEY / GEMINI_API_KEY が未設定です。.env.local.example を参考に .env.local へ設定してください。"
    );
    process.exitCode = 1;
    return;
  }

  const result = await syncTrends(prisma);
  for (const line of result.log) console.log(line);
  console.log(`\n完了: 追加${result.created}件 / 更新${result.updated}件 / スキップ${result.skipped}件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
