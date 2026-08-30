"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data";
import { PLAYBOOK_IDEAS } from "@/lib/playbook";
import CategoryTag from "@/components/CategoryTag";
import { toast } from "@/lib/toast";

async function copyIdea(title: string, steps: readonly string[]) {
  const text = [title, ...steps.map((s, i) => `${i + 1}. ${s}`)].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    toast(`「${title}」をコピーしました`);
  } catch {
    toast("コピーできませんでした", "error");
  }
}

export default function PlaybookClient() {
  const [active, setActive] = useState<"すべて" | (typeof CATEGORIES)[number]>("すべて");

  const visible =
    active === "すべて"
      ? PLAYBOOK_IDEAS
      : PLAYBOOK_IDEAS.filter((idea) => idea.category === active);

  return (
    <div>
      <div className="al-rail mt-6 flex gap-2 overflow-x-auto pb-2">
        {(["すべて", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`shrink-0 rounded-full px-4 py-2 font-display text-sm font-bold transition-colors ${
              active === c
                ? "bg-al-black text-white"
                : "bg-al-gray-100 text-al-gray-600 hover:bg-al-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-al-gray-400">{visible.length}件のネタ（タップでコピーできます）</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((idea) => (
          <article
            key={idea.id}
            className="al-flyer-card flex flex-col gap-2 rounded-xl bg-white p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <CategoryTag category={idea.category} />
            </div>
            <h3 className="font-display text-base font-bold leading-snug">{idea.title}</h3>
            <p className="text-sm leading-relaxed text-al-gray-600">{idea.hook}</p>
            <ol className="mt-1 space-y-1.5 border-t border-al-gray-100 pt-2">
              {idea.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-al-gray-500">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-al-gray-100 font-display text-[10px] font-bold text-al-gray-500">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => copyIdea(idea.title, idea.steps)}
              className="mt-2 self-start text-xs font-bold text-al-purple hover:underline"
            >
              このネタをコピーする
            </button>
          </article>
        ))}
        {visible.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-al-gray-400">
            このカテゴリーのネタは準備中です。
          </p>
        )}
      </div>
    </div>
  );
}
