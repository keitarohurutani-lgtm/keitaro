import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";

// 管理者が会員アカウントを削除するためのAPI。受講期間が終了した会員のアクセスを
// 停止する目的で使う想定（アカウントを削除するとログインできなくなる）。
// Idea/Activityはスキーマ上 onDelete: Cascade のため、会員に紐づく保存済み企画・
// 活動履歴も同時に削除される（不可逆操作。UI側で確認を必須にしている）。
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }
  if (!isAdminEmail(admin.email)) {
    return NextResponse.json({ error: "管理者権限がありません。" }, { status: 403 });
  }

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: "自分自身のアカウントはここから削除できません。" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "対象の会員が見つかりません。" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ deleted: true, email: target.email });
}
