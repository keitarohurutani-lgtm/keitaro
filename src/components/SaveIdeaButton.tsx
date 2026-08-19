"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SaveIdeaButton({
  ideaId,
  initialSaved,
}: {
  ideaId: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/toggle-save`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setSaved(json.idea.saved);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold transition-colors disabled:opacity-60 ${
        saved ? "bg-al-lime text-al-black" : "bg-al-black text-white hover:bg-al-gray-600"
      }`}
    >
      {saved ? "保存済み ✓" : "企画を保存する"}
    </button>
  );
}
