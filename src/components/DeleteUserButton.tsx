"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

// 会員アカウントの削除ボタン。誤操作で保存済み企画・活動履歴ごと消えてしまう
// 不可逆操作のため、対象のメールアドレスを入力しないと実行できないようにしている。
export default function DeleteUserButton({
  userId,
  email,
  displayName,
  redirectOnDelete = false,
}: {
  userId: string;
  email: string;
  displayName: string;
  redirectOnDelete?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const canDelete = input.trim().toLowerCase() === email.toLowerCase();

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "削除に失敗しました。");
      toast(`${displayName}さんのアカウントを削除しました`);
      if (redirectOnDelete) {
        router.push("/admin");
      } else {
        router.refresh();
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "削除に失敗しました。", "error");
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="font-bold text-red-600 hover:underline"
      >
        削除
      </button>
    );
  }

  return (
    <div className="inline-flex w-72 flex-col items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-left">
      <p className="text-xs leading-relaxed text-red-700">
        {displayName}さんのアカウントを完全に削除します。保存済み企画・活動履歴もすべて削除され、元に戻せません。続けるには、メールアドレス（{email}）を入力してください。
      </p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={email}
        autoComplete="off"
        className="w-full rounded-md border border-red-300 bg-white px-2 py-1 text-xs text-al-black outline-none focus:border-red-500"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canDelete || loading}
          onClick={handleDelete}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-opacity disabled:opacity-40"
        >
          {loading ? "削除中…" : "完全に削除する"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setConfirming(false);
            setInput("");
          }}
          className="rounded-md px-3 py-1.5 text-xs font-bold text-al-gray-500 hover:underline"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
