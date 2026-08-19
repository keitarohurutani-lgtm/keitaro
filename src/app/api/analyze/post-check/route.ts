import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postCheckCuts } from "@/lib/data";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: { videoName?: string } = {};
  try {
    body = await request.json();
  } catch {
    // ボディなしでも許容する
  }
  const videoName = body.videoName?.trim() || "アップロードされた動画";

  await prisma.activity.create({
    data: {
      userId,
      type: "POST_CHECK",
      text: `『${videoName}』をPOST CHECKで分析しました`,
    },
  });

  // 実際の映像フレーム解析は行っておらず、サンプルの分析コメントを返す簡易チェックです。
  return NextResponse.json({ videoName, cuts: postCheckCuts });
}
