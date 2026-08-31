import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { PERSONA_OPTIONS } from "@/lib/persona";
import type { Persona } from "@/generated/prisma/enums";
import type { ContentProposal } from "@/lib/content-proposal";

function isValidProposal(body: unknown): body is ContentProposal {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.title === "string" &&
    typeof b.purpose === "string" &&
    typeof b.concept === "string" &&
    typeof b.hook === "string" &&
    typeof b.structure === "string" &&
    typeof b.duration === "string" &&
    typeof b.difficulty === "string" &&
    typeof b.reason === "string"
  );
}

// SNSコンテンツ提案で3案のうち1つを選んだタイミングで、既存のIdea（企画）として保存する。
// これによりIDEA一覧・MY REPORTなど既存の仕組みにそのまま乗る。
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: { proposal?: unknown; platform?: string; persona?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  if (!isValidProposal(body.proposal)) {
    return NextResponse.json({ error: "企画データ（proposal）の内容が不正です。" }, { status: 400 });
  }
  const proposal = body.proposal;

  const persona =
    body.persona && PERSONA_OPTIONS.includes(body.persona as Persona)
      ? (body.persona as Persona)
      : null;

  const idea = await prisma.idea.create({
    data: {
      userId,
      trendId: null,
      persona,
      platform: typeof body.platform === "string" ? body.platform : null,
      concept: proposal.concept,
      difficulty: proposal.difficulty,
      title: proposal.title,
      reason: proposal.reason,
      opening: proposal.hook,
      structure: proposal.structure,
      duration: proposal.duration,
      generatedByAI: true,
      saved: false,
    },
    include: { trend: true },
  });

  // 「保存」（saved: true）は既存のSaveIdeaButtonで別途行う操作のため、ここでは
  // 「企画を選んだ」という生成寄りの活動として記録する（IDEA_SAVEDとは意味的に区別する）。
  await prisma.activity.create({
    data: {
      userId,
      type: "TREND_CHECK",
      text: `SNSコンテンツ提案から『${idea.title}』を選びました`,
    },
  });

  return NextResponse.json({ idea });
}
