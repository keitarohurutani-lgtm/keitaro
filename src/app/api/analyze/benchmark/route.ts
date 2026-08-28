import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import {
  compareVideosFromUrls,
  describeVideoAnalysisError,
  extractYoutubeVideoId,
  isSupportedVideoUrl,
} from "@/lib/ai";

// 2本の動画をAIが実際に読み込んで比較するため、通常のAPI呼び出しより時間がかかることがある。
export const maxDuration = 60;

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: { myVideoUrl?: string; referenceVideoUrl?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  const myVideoUrl = body.myVideoUrl?.trim();
  const referenceVideoUrl = body.referenceVideoUrl?.trim();
  if (!myVideoUrl || !referenceVideoUrl) {
    return NextResponse.json(
      { error: "自分の投稿・参考にしたい投稿、両方のリンクを入力してください。" },
      { status: 400 }
    );
  }
  if (!isSupportedVideoUrl(myVideoUrl) || !isSupportedVideoUrl(referenceVideoUrl)) {
    return NextResponse.json(
      { error: "今のところYouTubeのリンクのみ対応しています（TikTok/Instagramは非対応）。" },
      { status: 400 }
    );
  }

  try {
    const comparison = await compareVideosFromUrls(myVideoUrl, referenceVideoUrl);

    await prisma.activity.create({
      data: {
        userId,
        type: "BENCHMARK",
        text: `『${comparison.referenceVideo.title}』とBENCHMARKで比較しました`,
      },
    });

    const myVideoId = extractYoutubeVideoId(myVideoUrl);
    const referenceVideoId = extractYoutubeVideoId(referenceVideoUrl);

    return NextResponse.json({
      myVideoUrl,
      referenceVideoUrl,
      myThumbnailUrl: myVideoId ? `https://img.youtube.com/vi/${myVideoId}/hqdefault.jpg` : null,
      referenceThumbnailUrl: referenceVideoId
        ? `https://img.youtube.com/vi/${referenceVideoId}/hqdefault.jpg`
        : null,
      comparison,
    });
  } catch (err) {
    return NextResponse.json({ error: describeVideoAnalysisError(err) }, { status: 500 });
  }
}
