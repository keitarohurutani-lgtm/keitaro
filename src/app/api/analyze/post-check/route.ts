import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postCheckCuts } from "@/lib/data";

export async function POST(request: Request) {
  let body: { videoName?: string } = {};
  try {
    body = await request.json();
  } catch {
    // ボディなしでも許容する
  }
  const videoName = body.videoName?.trim() || "アップロードされた動画";

  await prisma.activity.create({
    data: {
      type: "POST_CHECK",
      text: `『${videoName}』をPOST CHECKで分析しました`,
    },
  });

  // 実際の映像フレーム解析は行っておらず、サンプルの分析コメントを返す簡易チェックです。
  return NextResponse.json({ videoName, cuts: postCheckCuts });
}
