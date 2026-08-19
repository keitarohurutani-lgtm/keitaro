import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateIdeaFromTrend, describeAiError } from "@/lib/ai";
import { PERSONA_OPTIONS } from "@/lib/persona";
import type { Persona } from "@/generated/prisma/enums";

export async function POST(request: Request) {
  let body: { trendId?: string; persona?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  const { trendId, persona } = body;
  if (!trendId || !persona || !PERSONA_OPTIONS.includes(persona as Persona)) {
    return NextResponse.json(
      { error: "trendId と persona（有効な値）を指定してください。" },
      { status: 400 }
    );
  }

  const trend = await prisma.trend.findUnique({ where: { id: trendId } });
  if (!trend) {
    return NextResponse.json({ error: "指定されたトレンドが見つかりません。" }, { status: 404 });
  }

  try {
    const generated = await generateIdeaFromTrend({
      trendName: trend.name,
      trendCategory: trend.category,
      trendDescription: trend.description,
      trendWhyHot: trend.whyHot,
      persona: persona as Persona,
    });

    const idea = await prisma.idea.create({
      data: {
        trendId: trend.id,
        persona: persona as Persona,
        generatedByAI: true,
        saved: false,
        ...generated,
      },
      include: { trend: true },
    });

    await prisma.activity.create({
      data: {
        type: "TREND_CHECK",
        text: `『${trend.name}』トレンドから企画『${idea.title}』を提案してもらいました`,
      },
    });

    return NextResponse.json({ idea });
  } catch (err) {
    return NextResponse.json({ error: describeAiError(err) }, { status: 502 });
  }
}
