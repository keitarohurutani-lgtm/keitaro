import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
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
        type: "IDEA_SAVED",
        text: `『${idea.title}』の企画を保存しました`,
      },
    });
  }

  return NextResponse.json({ idea: updated });
}
