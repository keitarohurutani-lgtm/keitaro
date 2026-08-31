"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import type { Persona } from "@/generated/prisma/enums";
import {
  PLATFORMS,
  PLATFORM_LABEL,
  INSTAGRAM_FORMATS,
  INSTAGRAM_FORMAT_LABEL,
  OBJECTIVES,
  OBJECTIVE_LABEL,
  CONTENT_TYPES,
  CONTENT_TYPE_LABEL,
  DIRECTIONS,
  DIRECTION_LABEL,
  MAX_DIRECTIONS,
  MAX_ADDITIONAL_REQUEST_LENGTH,
  FOLLOWUP_ACTIONS,
  FOLLOWUP_ACTION_LABEL,
  type Platform,
  type InstagramFormat,
  type Objective,
  type ContentType,
  type Direction,
  type ContentRequest,
  type ContentProposal,
  type FollowUpAction,
  type FollowUpResult,
} from "@/lib/content-proposal";

type Step = "platform" | "objective" | "contentType" | "direction" | "additional" | "review";
const STEPS: Step[] = ["platform", "objective", "contentType", "direction", "additional", "review"];
const STEP_LABEL: Record<Step, string> = {
  platform: "STEP 1：投稿するSNS",
  objective: "STEP 2：今回の投稿目的",
  contentType: "STEP 3：作りたい投稿タイプ",
  direction: "STEP 4：投稿の方向性",
  additional: "追加要望（任意）",
  review: "選択内容の確認",
};

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-left text-sm font-bold transition-colors ${
        active ? "bg-al-black text-white" : "bg-al-gray-100 text-al-gray-600 hover:bg-al-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function ContentProposalWizard({ persona }: { persona: Persona }) {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  const [platform, setPlatform] = useState<Platform | null>(null);
  const [instagramFormat, setInstagramFormat] = useState<InstagramFormat | null>(null);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [direction, setDirection] = useState<Direction[]>([]);
  const [additionalRequest, setAdditionalRequest] = useState("");

  const [proposals, setProposals] = useState<ContentProposal[] | null>(null);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<{ proposal: ContentProposal; ideaId: string } | null>(
    null
  );
  const [selecting, setSelecting] = useState(false);
  const [followUps, setFollowUps] = useState<Partial<Record<FollowUpAction, FollowUpResult>>>({});
  const [loadingAction, setLoadingAction] = useState<FollowUpAction | null>(null);

  const canGoNext =
    (step === "platform" && platform !== null) ||
    (step === "objective" && objective !== null) ||
    (step === "contentType" && contentType !== null) ||
    (step === "direction" && direction.length > 0) ||
    step === "additional" ||
    step === "review";

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));
  const jumpTo = (target: Step) => setStepIndex(STEPS.indexOf(target));

  const toggleDirection = (d: Direction) => {
    setDirection((prev) => {
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      if (prev.length >= MAX_DIRECTIONS) return prev;
      return [...prev, d];
    });
  };

  const buildContentRequest = (): ContentRequest | null => {
    if (!platform || !objective || !contentType || direction.length === 0) return null;
    return {
      platform,
      instagramFormat: platform === "instagram" && instagramFormat ? instagramFormat : undefined,
      objective,
      contentType,
      direction,
      additionalRequest: additionalRequest.trim() || undefined,
    };
  };

  const submitContentRequest = async () => {
    const contentRequest = buildContentRequest();
    if (!contentRequest) {
      setError("STEP1〜4を選択してください。");
      return;
    }
    setLoadingProposals(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentRequest, persona }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "企画提案に失敗しました。");
      setProposals(json.proposals);
      setSelected(null);
      setFollowUps({});
      toast("AIが企画案を3つ提案しました");
    } catch (err) {
      const message = err instanceof Error ? err.message : "企画提案に失敗しました。";
      setError(message);
      toast(message, "error");
    } finally {
      setLoadingProposals(false);
    }
  };

  const selectProposal = async (proposal: ContentProposal) => {
    const contentRequest = buildContentRequest();
    if (!contentRequest) return;
    setSelecting(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas/propose/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal, platform: contentRequest.platform, persona }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "企画の選択に失敗しました。");
      setSelected({ proposal, ideaId: json.idea.id });
      setFollowUps({});
      toast(`『${proposal.title}』を選びました`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "企画の選択に失敗しました。";
      setError(message);
      toast(message, "error");
    } finally {
      setSelecting(false);
    }
  };

  const runFollowUp = async (actionType: FollowUpAction) => {
    const contentRequest = buildContentRequest();
    if (!selected || !contentRequest) return;
    setLoadingAction(actionType);
    setError(null);
    try {
      const res = await fetch("/api/ideas/propose/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal: selected.proposal,
          contentRequest,
          actionType,
          persona,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "生成に失敗しました。");
      setFollowUps((prev) => ({ ...prev, [actionType]: json.result }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "生成に失敗しました。";
      setError(message);
      toast(message, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const regenerate = () => {
    setProposals(null);
    setSelected(null);
    setFollowUps({});
    submitContentRequest();
  };

  const resetAll = () => {
    setStepIndex(0);
    setPlatform(null);
    setInstagramFormat(null);
    setObjective(null);
    setContentType(null);
    setDirection([]);
    setAdditionalRequest("");
    setProposals(null);
    setSelected(null);
    setFollowUps({});
    setError(null);
  };

  // ===== 企画選択後：詳細アクション画面 =====
  if (selected) {
    return (
      <div className="mt-4 space-y-4">
        <div className="al-flyer-card rounded-xl p-4">
          <p className="font-display text-xs font-bold tracking-widest text-al-purple">
            選んだ企画
          </p>
          <h3 className="mt-1 font-display text-base font-bold">{selected.proposal.title}</h3>
          <p className="mt-1 text-sm text-al-gray-600">{selected.proposal.concept}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FOLLOWUP_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => runFollowUp(action)}
              disabled={loadingAction !== null}
              className="rounded-full bg-al-black px-4 py-2 font-display text-xs font-bold text-white transition-colors hover:bg-al-gray-600 disabled:opacity-50"
            >
              {loadingAction === action ? "生成中…" : FOLLOWUP_ACTION_LABEL[action]}
            </button>
          ))}
          <button
            type="button"
            onClick={regenerate}
            disabled={loadingAction !== null || loadingProposals}
            className="rounded-full border border-al-gray-200 px-4 py-2 font-display text-xs font-bold text-al-gray-600 hover:bg-al-gray-50 disabled:opacity-50"
          >
            別案を出す
          </button>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

        {FOLLOWUP_ACTIONS.filter((a) => followUps[a]).map((action) => {
          const result = followUps[action]!;
          return (
            <div key={action} className="al-flyer-card rounded-xl p-4">
              <p className="font-display text-xs font-bold tracking-widest text-al-blue">
                {FOLLOWUP_ACTION_LABEL[action]}
              </p>
              {result.actionType === "script" && result.cuts ? (
                <div className="mt-3 space-y-3">
                  {result.cuts.map((cut, i) => (
                    <div key={i} className="rounded-lg bg-al-gray-50 p-3">
                      <p className="font-display text-sm font-bold text-al-black">
                        {cut.timeRange}
                      </p>
                      <dl className="mt-1.5 space-y-1 text-sm text-al-gray-600">
                        <div>
                          <dt className="inline font-bold text-al-gray-400">セリフ：</dt>
                          <dd className="inline">{cut.dialogue}</dd>
                        </div>
                        <div>
                          <dt className="inline font-bold text-al-gray-400">テロップ：</dt>
                          <dd className="inline">{cut.telop}</dd>
                        </div>
                        <div>
                          <dt className="inline font-bold text-al-gray-400">画角：</dt>
                          <dd className="inline">{cut.camera}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-al-gray-600">
                  {result.text}
                </p>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={resetAll}
          className="text-sm font-bold text-al-purple hover:underline"
        >
          最初からやり直す
        </button>
      </div>
    );
  }

  // ===== 3案の結果表示 =====
  if (proposals) {
    return (
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {proposals.map((p, i) => (
            <div key={i} className="al-flyer-card flex flex-col gap-2 rounded-xl p-4">
              <span className="w-fit rounded-md bg-al-purple px-2 py-0.5 font-display text-[11px] font-bold text-white">
                案{i + 1}
              </span>
              <h3 className="font-display text-base font-bold leading-snug">{p.title}</h3>
              <p className="text-sm leading-relaxed text-al-gray-600">{p.concept}</p>
              <div className="mt-1 space-y-1 border-t border-al-gray-100 pt-2 text-xs text-al-gray-500">
                <p>
                  <span className="font-bold text-al-black">冒頭フック：</span>
                  {p.hook}
                </p>
                <p>
                  <span className="font-bold text-al-black">想定尺：</span>
                  {p.duration}
                </p>
                <p>
                  <span className="font-bold text-al-black">撮影難易度：</span>
                  {p.difficulty}
                </p>
              </div>
              <button
                type="button"
                onClick={() => selectProposal(p)}
                disabled={selecting}
                className="mt-auto rounded-full bg-al-black px-4 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-al-gray-600 disabled:opacity-50"
              >
                {selecting ? "選択中…" : "この企画で作る"}
              </button>
            </div>
          ))}
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <button
          type="button"
          onClick={regenerate}
          disabled={loadingProposals}
          className="text-sm font-bold text-al-purple hover:underline disabled:opacity-50"
        >
          {loadingProposals ? "生成中…" : "別の案をもう一度出す"}
        </button>
      </div>
    );
  }

  // ===== ステップ入力 =====
  return (
    <div className="mt-4">
      {stepIndex === 0 && (
        <p className="mb-3 rounded-lg bg-al-gray-50 px-3 py-2 text-xs text-al-gray-500">
          5つの質問にタップで答えるだけです。あとから戻って選び直すこともできます。
        </p>
      )}
      <div className="flex items-center gap-2 text-[11px] text-al-gray-400">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIndex ? "bg-al-black" : "bg-al-gray-100"
            }`}
          />
        ))}
      </div>
      <p className="mt-3 font-display text-sm font-bold text-al-gray-500">{STEP_LABEL[step]}</p>

      {step === "platform" && (
        <div className="mt-3 space-y-3">
          <p className="font-display text-lg font-bold">どのSNSに投稿しますか？</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <PillButton key={p} active={platform === p} onClick={() => setPlatform(p)}>
                {PLATFORM_LABEL[p]}
              </PillButton>
            ))}
          </div>
          {platform === "instagram" && (
            <div className="mt-2">
              <p className="text-xs font-bold text-al-gray-500">形式（任意）</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {INSTAGRAM_FORMATS.map((f) => (
                  <PillButton
                    key={f}
                    active={instagramFormat === f}
                    onClick={() => setInstagramFormat(instagramFormat === f ? null : f)}
                  >
                    {INSTAGRAM_FORMAT_LABEL[f]}
                  </PillButton>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "objective" && (
        <div className="mt-3 space-y-3">
          <p className="font-display text-lg font-bold">今回の投稿で一番叶えたいことは？</p>
          <div className="flex flex-wrap gap-2">
            {OBJECTIVES.map((o) => (
              <PillButton key={o} active={objective === o} onClick={() => setObjective(o)}>
                {OBJECTIVE_LABEL[o]}
              </PillButton>
            ))}
          </div>
        </div>
      )}

      {step === "contentType" && (
        <div className="mt-3 space-y-3">
          <p className="font-display text-lg font-bold">どんな投稿を作りたいですか？</p>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((c) => (
              <PillButton key={c} active={contentType === c} onClick={() => setContentType(c)}>
                {CONTENT_TYPE_LABEL[c]}
              </PillButton>
            ))}
          </div>
        </div>
      )}

      {step === "direction" && (
        <div className="mt-3 space-y-3">
          <p className="font-display text-lg font-bold">今回はどんな投稿にしたいですか？</p>
          <p className="text-xs text-al-gray-400">最大{MAX_DIRECTIONS}つまで選べます</p>
          <div className="flex flex-wrap gap-2">
            {DIRECTIONS.map((d) => (
              <PillButton key={d} active={direction.includes(d)} onClick={() => toggleDirection(d)}>
                {DIRECTION_LABEL[d]}
              </PillButton>
            ))}
          </div>
        </div>
      )}

      {step === "additional" && (
        <div className="mt-3 space-y-2">
          <p className="font-display text-lg font-bold">今回入れたい内容はありますか？</p>
          <p className="text-xs text-al-gray-500">
            入れたい言葉・最近あった出来事・告知したい内容などがあれば入力してください。特になければ空欄でOKです。
          </p>
          <textarea
            value={additionalRequest}
            onChange={(e) => setAdditionalRequest(e.target.value)}
            maxLength={MAX_ADDITIONAL_REQUEST_LENGTH}
            rows={3}
            className="w-full rounded-xl border border-al-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-al-black"
          />
          <p className="text-right text-[11px] text-al-gray-400">
            {additionalRequest.length}/{MAX_ADDITIONAL_REQUEST_LENGTH}
          </p>
        </div>
      )}

      {step === "review" && (
        <div className="mt-3 space-y-2">
          <p className="font-display text-lg font-bold">この内容でよろしいですか？</p>
          <div className="al-flyer-card divide-y divide-al-gray-100 rounded-xl">
            {[
              {
                label: "投稿するSNS",
                value: platform
                  ? `${PLATFORM_LABEL[platform]}${
                      instagramFormat ? `（${INSTAGRAM_FORMAT_LABEL[instagramFormat]}）` : ""
                    }`
                  : "未選択",
                jump: "platform" as Step,
              },
              {
                label: "投稿目的",
                value: objective ? OBJECTIVE_LABEL[objective] : "未選択",
                jump: "objective" as Step,
              },
              {
                label: "投稿タイプ",
                value: contentType ? CONTENT_TYPE_LABEL[contentType] : "未選択",
                jump: "contentType" as Step,
              },
              {
                label: "投稿の方向性",
                value:
                  direction.length > 0
                    ? direction.map((d) => DIRECTION_LABEL[d]).join("／")
                    : "未選択",
                jump: "direction" as Step,
              },
              {
                label: "追加要望",
                value: additionalRequest.trim() || "なし",
                jump: "additional" as Step,
              },
            ].map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={() => jumpTo(row.jump)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-al-gray-50"
              >
                <span>
                  <span className="block font-display text-xs font-bold text-al-gray-400">
                    {row.label}
                  </span>
                  <span className="text-sm font-bold">{row.value}</span>
                </span>
                <span className="shrink-0 text-xs font-bold text-al-purple">変更する</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="shrink-0 whitespace-nowrap rounded-full border border-al-gray-200 px-5 py-2.5 font-display text-sm font-bold text-al-gray-600 hover:bg-al-gray-50"
          >
            戻る
          </button>
        )}
        {step === "review" ? (
          <button
            type="button"
            onClick={submitContentRequest}
            disabled={loadingProposals}
            className="flex-1 rounded-full bg-al-black px-6 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-al-gray-600 disabled:opacity-60 sm:flex-none"
          >
            {loadingProposals ? "AIが考え中…" : "AIに企画を3案提案してもらう"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            className="shrink-0 whitespace-nowrap rounded-full bg-al-black px-6 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-al-gray-600 disabled:opacity-40"
          >
            次へ
          </button>
        )}
      </div>
    </div>
  );
}
