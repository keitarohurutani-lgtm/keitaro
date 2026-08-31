import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { PLAYBOOK_IDEAS } from "@/lib/playbook";

// PLAYBOOK（ネタ集）のお気に入りトグル。ネタ自体は固定データのため、idが実在する
// ネタのものかだけ検証し、あとはuserId×playbookIdeaIdの有無で単純にON/OFFする。
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!PLAYBOOK_IDEAS.some((idea) => idea.id === id)) {
    return NextResponse.json({ error: "指定されたネタが見つかりません。" }, { status: 404 });
  }

  const existing = await prisma.playbookFavorite.findUnique({
    where: { userId_playbookIdeaId: { userId, playbookIdeaId: id } },
  });

  if (existing) {
    await prisma.playbookFavorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.playbookFavorite.create({ data: { userId, playbookIdeaId: id } });
  return NextResponse.json({ favorited: true });
}
