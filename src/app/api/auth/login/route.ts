import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionCookieValue, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const invalidCredentialsError = NextResponse.json(
    { error: "メールアドレスまたはパスワードが正しくありません。" },
    { status: 401 }
  );

  if (!email || !password) return invalidCredentialsError;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return invalidCredentialsError;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return invalidCredentialsError;

  const cookieValue = await createSessionCookieValue(user.id);
  const response = NextResponse.json({
    user: { id: user.id, email: user.email, displayName: user.displayName },
  });
  response.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
