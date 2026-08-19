import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { id } = await context.params;

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea || idea.userId !== userId) {
    return NextResponse.json({ error: "指定された企画が見つかりません。" }, { status: 404 });
  }

  const nextSaved = !idea.saved;
  const updated = await prisma.idea.update({
    where: { id },
    data: { saved: nextSaved },
  });

  if (nextSaved) {
    await prisma.activity.create({
      data: {
        userId,
        type: "IDEA_SAVED",
        text: `『${idea.title}』の企画を保存しました`,
      },
    });
  }

  return NextResponse.json({ idea: updated });
}
