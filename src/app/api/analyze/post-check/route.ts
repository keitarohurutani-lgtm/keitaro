import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import {
  analyzeVideoFromUrl,
  describeVideoAnalysisError,
  extractYoutubeVideoId,
  isSupportedVideoUrl,
} from "@/lib/ai";
import { fetchTikTokOembed, isTikTokUrl } from "@/lib/sources/tiktok";

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

  // TikTok: 実際の動画表示（公式oEmbed）はできるが、AIによる画角・編集分析はできない
  // （Gemini自体がTikTokの動画URLを処理できないため）。
  if (isTikTokUrl(videoUrl)) {
    const oembed = await fetchTikTokOembed(videoUrl);
    if (!oembed) {
      return NextResponse.json(
        { error: "この動画を読み込めませんでした。URLが正しいか、動画が公開設定になっているかご確認ください。" },
        { status: 400 }
      );
    }

    await prisma.activity.create({
      data: {
        userId,
        type: "POST_CHECK",
        text: `『${oembed.title || "TikTok動画"}』をPOST CHECKで確認しました`,
      },
    });

    return NextResponse.json({ videoUrl, platform: "tiktok", oembed });
  }

  if (!isSupportedVideoUrl(videoUrl)) {
    return NextResponse.json(
      { error: "対応しているのはYouTubeとTikTokのリンクです（Instagramは非対応）。" },
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

    return NextResponse.json({ videoUrl, platform: "youtube", thumbnailUrl, analysis });
  } catch (err) {
    return NextResponse.json({ error: describeVideoAnalysisError(err) }, { status: 500 });
  }
}
