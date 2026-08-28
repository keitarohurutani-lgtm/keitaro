import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import {
  analyzeVideoFromUrl,
  describeVideoAnalysisError,
  extractYoutubeVideoId,
  isSupportedVideoUrl,
} from "@/lib/ai";

// 動画をAIが実際に読み込んで分析するため、通常のAPI呼び出しより時間がかかることがある。
export const maxDuration = 60;

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: { videoUrl?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  const videoUrl = body.videoUrl?.trim();
  if (!videoUrl) {
    return NextResponse.json({ error: "動画のリンクを入力してください。" }, { status: 400 });
  }
  if (!isSupportedVideoUrl(videoUrl)) {
    return NextResponse.json(
      { error: "今のところYouTubeのリンクのみ対応しています（TikTok/Instagramは非対応）。" },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeVideoFromUrl(videoUrl);

    await prisma.activity.create({
      data: {
        userId,
        type: "POST_CHECK",
        text: `『${analysis.videoTitle}』をPOST CHECKで分析しました`,
      },
    });

    const videoId = extractYoutubeVideoId(videoUrl);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

    return NextResponse.json({ videoUrl, thumbnailUrl, analysis });
  } catch (err) {
    return NextResponse.json({ error: describeVideoAnalysisError(err) }, { status: 500 });
  }
}
