import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateIdeaFromTrend, generateIdeaFromPrompt, describeAiError } from "@/lib/ai";
import { PERSONA_OPTIONS } from "@/lib/persona";
import { getCurrentUserId } from "@/lib/auth";
import type { Persona } from "@/generated/prisma/enums";

const MAX_INSTRUCTION_LENGTH = 500;

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: { trendId?: string; instruction?: string; persona?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  const { trendId, persona } = body;
  const instruction = body.instruction?.trim();

  if (!persona || !PERSONA_OPTIONS.includes(persona as Persona)) {
    return NextResponse.json({ error: "persona（有効な値）を指定してください。" }, { status: 400 });
  }
  if (!trendId && !instruction) {
    return NextResponse.json(
      { error: "trendId またはオリジナルの指示（instruction）のどちらかを指定してください。" },
      { status: 400 }
    );
  }
  if (instruction && instruction.length > MAX_INSTRUCTION_LENGTH) {
    return NextResponse.json(
      { error: `指示は${MAX_INSTRUCTION_LENGTH}文字以内で入力してください。` },
      { status: 400 }
    );
  }

  try {
    // オリジナル指示モード：トレンドを使わず、ユーザーの自由入力だけから生成する。
    if (instruction) {
      const generated = await generateIdeaFromPrompt({
        instruction,
        persona: persona as Persona,
      });

      const idea = await prisma.idea.create({
        data: {
          userId,
          trendId: null,
          customPrompt: instruction,
          persona: persona as Persona,
          generatedByAI: true,
          saved: false,
          ...generated,
        },
        include: { trend: true },
      });

      await prisma.activity.create({
        data: {
          userId,
          type: "TREND_CHECK",
          text: `オリジナルの指示から企画『${idea.title}』を提案してもらいました`,
        },
      });

      return NextResponse.json({ idea });
    }

    // トレンドモード（従来通り）
    const trend = await prisma.trend.findUnique({ where: { id: trendId } });
    if (!trend) {
      return NextResponse.json({ error: "指定されたトレンドが見つかりません。" }, { status: 404 });
    }

    const generated = await generateIdeaFromTrend({
      trendName: trend.name,
      trendCategory: trend.category,
      trendDescription: trend.description,
      trendWhyHot: trend.whyHot,
      persona: persona as Persona,
    });

    const idea = await prisma.idea.create({
      data: {
        userId,
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
        userId,
        type: "TREND_CHECK",
        text: `『${trend.name}』トレンドから企画『${idea.title}』を提案してもらいました`,
      },
    });

    return NextResponse.json({ idea });
  } catch (err) {
    return NextResponse.json({ error: describeAiError(err) }, { status: 502 });
  }
}
