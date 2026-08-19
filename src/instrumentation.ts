// サーバー起動時に一度だけ呼ばれる。TRENDページの定期自動更新タイマーをここで登録する。
// Edge runtimeでは動かさない（setIntervalやDBアクセスはNode runtime前提のため）。
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const g = globalThis as unknown as { __trendSyncTimerStarted?: boolean };
  if (g.__trendSyncTimerStarted) return; // 開発サーバーのホットリロードで二重登録しない
  g.__trendSyncTimerStarted = true;

  const { trendSyncReady, syncTrends } = await import("./lib/trend-sync");

  if (!trendSyncReady()) {
    console.log(
      "[trend-sync] YOUTUBE_API_KEY / GEMINI_API_KEY が未設定のため、トレンド定期更新は無効です。"
    );
    return;
  }

  const { prisma } = await import("./lib/prisma");
  const minutes = Number(process.env.TREND_SYNC_INTERVAL_MINUTES) || 360; // 既定6時間

  const runSync = () => {
    syncTrends(prisma)
      .then((result) => {
        console.log(
          `[trend-sync] 完了: 追加${result.created}件 / 更新${result.updated}件 / スキップ${result.skipped}件`
        );
      })
      .catch((e) => {
        console.error("[trend-sync] 定期更新に失敗しました:", e);
      });
  };

  console.log(`[trend-sync] 定期更新を開始します（${minutes}分間隔、起動時に1回実行）。`);
  runSync();
  setInterval(runSync, minutes * 60 * 1000);
}
