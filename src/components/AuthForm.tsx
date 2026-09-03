"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { toast } from "@/lib/toast";

type Mode = "login" | "register";

// 無料枠のDB（Neon）は数日アクセスがないと自動でスリープし、次のアクセス時に
// 起動までの数秒〜十数秒の遅延が発生することがある。何も表示せずただ固まって
// 見えると「壊れている」と誤解されるため、一定時間経過ごとに状況を案内する。
const SLOW_HINT_MS = 4_000;
const TIMEOUT_MS = 20_000;

export default function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSlow(false);
    setError(null);

    const slowHintTimer = setTimeout(() => setSlow(true), SLOW_HINT_MS);
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login" ? { email, password } : { email, password, displayName }
        ),
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "処理に失敗しました。");
      }
      toast(
        mode === "login"
          ? `おかえりなさい、${json.user.displayName}さん`
          : `ようこそ、${json.user.displayName}さん！`
      );
      // 成功時はこの画面自体が遷移で置き換わるため、ここでloadingをfalseに戻さない
      // （戻すと遷移中に「ログイン」ボタンが押せる状態に見えてしまい、
      // 何も起きていないように見える）。
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "時間がかかりすぎています。データベースが起動中の可能性があるので、少し待ってからもう一度お試しください。"
          : err instanceof Error
            ? err.message
            : "処理に失敗しました。";
      setError(message);
      setLoading(false);
      setSlow(false);
    } finally {
      clearTimeout(slowHintTimer);
      clearTimeout(timeoutTimer);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-al-black px-6 py-16 text-white">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 bg-al-purple opacity-20"
        style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 bg-al-pink opacity-10"
        style={{ clipPath: "polygon(0 0, 100% 20%, 80% 100%, 0 100%)" }}
      />
      <div className="relative mx-auto w-full max-w-sm">
        <Logo variant="light" className="text-2xl" />

        <p className="mt-8 font-display text-xs font-bold tracking-[0.2em] text-al-lime">
          {mode === "login" ? "LOGIN" : "SIGN UP"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">
          {mode === "login" ? "おかえりなさい" : "ASOBI LABへようこそ"}
        </h1>
        <p className="mt-2 text-sm text-al-gray-300">
          {mode === "login"
            ? "登録したメールアドレスでログインしてください。"
            : "アカウントを作成して、あなただけのSNS活動レポートを始めましょう。"}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === "register" && (
            <div>
              <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-300">
                表示名
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-sm text-al-black outline-none focus:border-al-pink"
                placeholder="例：ひなの"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-300">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-sm text-al-black outline-none focus:border-al-pink"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-300">
              パスワード
            </label>
            <input
              type="password"
              required
              minLength={mode === "register" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-white px-3 py-2.5 text-sm text-al-black outline-none focus:border-al-pink"
              placeholder={mode === "register" ? "8文字以上" : ""}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-al-pink/10 px-3 py-2 text-xs text-al-pink">{error}</p>
          )}
          {loading && slow && !error && (
            <p className="rounded-lg bg-white/5 px-3 py-2 text-xs text-al-gray-300">
              少し時間がかかっています。準備中の可能性があるので、そのままお待ちください。
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-al-pink px-6 py-3 font-display text-sm font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? "処理中…" : mode === "login" ? "ログイン" : "アカウントを作成"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-al-gray-300">
          {mode === "login" ? (
            <>
              アカウントをお持ちでない方は{" "}
              <Link href="/register" className="font-bold text-al-lime hover:underline">
                新規登録
              </Link>
            </>
          ) : (
            <>
              すでにアカウントをお持ちの方は{" "}
              <Link href="/login" className="font-bold text-al-lime hover:underline">
                ログイン
              </Link>
            </>
          )}
        </p>

        {mode === "login" && (
          <p className="mt-3 text-center text-xs text-al-gray-500">
            ログインできない場合は、運営にお問い合わせください。
          </p>
        )}
      </div>
    </div>
  );
}
