import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProposalFollowUp, describeAiError } from "@/lib/ai";
import { getCurrentUserId } from "@/lib/auth";
import { PERSONA_LABEL, PERSONA_OPTIONS } from "@/lib/persona";
import type { Persona } from "@/generated/prisma/enums";
import {
  PLATFORMS,
  INSTAGRAM_FORMATS,
  OBJECTIVES,
  CONTENT_TYPES,
  DIRECTIONS,
  MAX_DIRECTIONS,
  FOLLOWUP_ACTIONS,
  FOLLOWUP_ACTION_LABEL,
  type ContentRequest,
  type ContentProposal,
  type FollowUpAction,
} from "@/lib/content-proposal";

function isValidContentRequest(body: unknown): body is ContentRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!PLATFORMS.includes(b.platform as never)) return false;
  if (b.instagramFormat !== undefined && !INSTAGRAM_FORMATS.includes(b.instagramFormat as never)) {
    return false;
  }
  if (!OBJECTIVES.includes(b.objective as never)) return false;
  if (!CONTENT_TYPES.includes(b.contentType as never)) return false;
  if (
    !Array.isArray(b.direction) ||
    b.direction.length === 0 ||
    b.direction.length > MAX_DIRECTIONS ||
    !b.direction.every((d) => DIRECTIONS.includes(d as never))
  ) {
    return false;
  }
  return true;
}

function isValidProposal(body: unknown): body is ContentProposal {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.title === "string" &&
    typeof b.concept === "string" &&
    typeof b.hook === "string" &&
    typeof b.structure === "string" &&
    typeof b.duration === "string"
  );
}

// 選択済みの企画に対して、台本／詳しい構成／キャプション／撮影方法のいずれかを生成する。
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: {
    proposal?: unknown;
    contentRequest?: unknown;
    actionType?: string;
    persona?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  if (!isValidProposal(body.proposal)) {
    return NextResponse.json({ error: "企画データ（proposal）の内容が不正です。" }, { status: 400 });
  }
  if (!isValidContentRequest(body.contentRequest)) {
    return NextResponse.json(
      { error: "投稿条件（contentRequest）の内容が不正です。" },
      { status: 400 }
    );
  }
  if (!FOLLOWUP_ACTIONS.includes(body.actionType as FollowUpAction)) {
    return NextResponse.json({ error: "actionTypeの値が不正です。" }, { status: 400 });
  }
  const actionType = body.actionType as FollowUpAction;
  const proposal = body.proposal;
  const contentRequest = body.contentRequest;

  const persona =
    body.persona && PERSONA_OPTIONS.includes(body.persona as Persona)
      ? (body.persona as Persona)
      : null;

  try {
    const result = await generateProposalFollowUp({
      proposal,
      actionType,
      contentRequest,
      creatorProfile: { brandImage: persona ? PERSONA_LABEL[persona] : undefined },
    });

    await prisma.activity.create({
      data: {
        userId,
        type: "TREND_CHECK",
        text: `『${proposal.title}』の${FOLLOWUP_ACTION_LABEL[actionType]}をAIに作ってもらいました`,
      },
    });

    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: describeAiError(err) }, { status: 502 });
  }
}
