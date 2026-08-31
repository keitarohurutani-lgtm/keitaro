import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateContentProposals, describeAiError } from "@/lib/ai";
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
  MAX_ADDITIONAL_REQUEST_LENGTH,
  type ContentRequest,
} from "@/lib/content-proposal";

function isValidContentRequest(body: unknown): body is ContentRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!PLATFORMS.includes(b.platform as never)) return false;
  if (
    b.instagramFormat !== undefined &&
    !INSTAGRAM_FORMATS.includes(b.instagramFormat as never)
  ) {
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
  if (
    b.additionalRequest !== undefined &&
    (typeof b.additionalRequest !== "string" ||
      b.additionalRequest.length > MAX_ADDITIONAL_REQUEST_LENGTH)
  ) {
    return false;
  }
  return true;
}

// SNSコンテンツ提案：選択式の投稿条件から企画案を3つ生成する（DBには保存しない。
// ユーザーが1案を選んだ時点で /api/ideas/propose/select が保存する）。
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: { contentRequest?: unknown; persona?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  if (!isValidContentRequest(body.contentRequest)) {
    return NextResponse.json(
      { error: "投稿条件（contentRequest）の内容が不正です。" },
      { status: 400 }
    );
  }
  const contentRequest = body.contentRequest;

  const persona =
    body.persona && PERSONA_OPTIONS.includes(body.persona as Persona)
      ? (body.persona as Persona)
      : null;

  try {
    const proposals = await generateContentProposals({
      contentRequest,
      creatorProfile: { brandImage: persona ? PERSONA_LABEL[persona] : undefined },
    });

    await prisma.activity.create({
      data: {
        userId,
        type: "TREND_CHECK",
        text: "SNSコンテンツ提案（選択式）でAIに企画案を3つ出してもらいました",
      },
    });

    return NextResponse.json({ proposals, contentRequest, persona });
  } catch (err) {
    return NextResponse.json({ error: describeAiError(err) }, { status: 502 });
  }
}
