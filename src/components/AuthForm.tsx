"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login" ? { email, password } : { email, password, displayName }
        ),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "処理に失敗しました。");
      }
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-6 py-16">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-pink">
        {mode === "login" ? "LOGIN" : "SIGN UP"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold">
        {mode === "login" ? "おかえりなさい" : "ASOBI LABへようこそ"}
      </h1>
      <p className="mt-2 text-sm text-al-gray-500">
        {mode === "login"
          ? "登録したメールアドレスでログインしてください。"
          : "アカウントを作成して、あなただけのSNS活動レポートを始めましょう。"}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "register" && (
          <div>
            <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-500">
              表示名
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-al-gray-200 px-3 py-2.5 text-sm"
              placeholder="例：ひなの"
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-500">
            メールアドレス
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-al-gray-200 px-3 py-2.5 text-sm"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-display text-xs font-bold text-al-gray-500">
            パスワード
          </label>
          <input
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-al-gray-200 px-3 py-2.5 text-sm"
            placeholder={mode === "register" ? "8文字以上" : ""}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-al-black px-6 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-al-gray-600 disabled:opacity-60"
        >
          {loading ? "処理中…" : mode === "login" ? "ログイン" : "アカウントを作成"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-al-gray-500">
        {mode === "login" ? (
          <>
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="font-bold text-al-purple hover:underline">
              新規登録
            </Link>
          </>
        ) : (
          <>
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className="font-bold text-al-purple hover:underline">
              ログイン
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
