import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncSongRankings, songSyncReady } from "@/lib/song-sync";

// Vercel Cronから1日1回呼ばれる音源ランキング自動更新エンドポイント。
// Vercel Cronは呼び出し時に Authorization: Bearer {CRON_SECRET} を付与するため、
// それを検証して第三者が無関係にAPIクォータを消費するのを防ぐ。
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!songSyncReady()) {
    return NextResponse.json(
      { skipped: true, message: "YOUTUBE_API_KEY / GEMINI_API_KEY が未設定のため実行しませんでした。" },
      { status: 200 }
    );
  }

  const result = await syncSongRankings(prisma);
  return NextResponse.json(result);
}
