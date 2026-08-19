import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { benchmarkPair, benchmarkNextActions } from "@/lib/data";
import { getCurrentUserId } from "@/lib/auth";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  await prisma.activity.create({
    data: {
      userId,
      type: "BENCHMARK",
      text: `『${benchmarkPair.reference.title}』をBENCHMARKで比較しました`,
    },
  });

  // 実際の映像フレーム解析は行っておらず、サンプルの比較データを返す簡易チェックです。
  return NextResponse.json({ pair: benchmarkPair, nextActions: benchmarkNextActions });
}
