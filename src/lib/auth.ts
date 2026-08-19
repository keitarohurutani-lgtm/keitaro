import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionCookieValue } from "@/lib/session";

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionCookieValue(token);
}

// middleware側で未ログインは既に/loginへリダイレクトされているため、
// 各ページ・API内では基本的にセッションが存在する前提で呼んでよい。
// それでもセッション切れ等の防御として、呼び出し側でnullチェックすること。
export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
