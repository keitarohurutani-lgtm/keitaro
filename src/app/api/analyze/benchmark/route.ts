import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { benchmarkPair, benchmarkNextActions } from "@/lib/data";

export async function POST() {
  await prisma.activity.create({
    data: {
      type: "BENCHMARK",
      text: `『${benchmarkPair.reference.title}』をBENCHMARKで比較しました`,
    },
  });

  // 実際の映像フレーム解析は行っておらず、サンプルの比較データを返す簡易チェックです。
  return NextResponse.json({ pair: benchmarkPair, nextActions: benchmarkNextActions });
}
