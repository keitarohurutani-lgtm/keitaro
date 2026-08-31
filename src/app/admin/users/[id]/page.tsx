import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getReportCounts, formatRelativeDate } from "@/lib/report";
import { PERSONA_LABEL } from "@/lib/persona";
import type { Persona } from "@/generated/prisma/enums";
import CategoryTag from "@/components/CategoryTag";
import DeleteUserButton from "@/components/DeleteUserButton";

// 個別会員の企画・活動は常に最新状態を反映する必要があるため、静的プリレンダリングを無効化する。
export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");
  if (!isAdminEmail(admin.email)) redirect("/");

  const { id } = await params;
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) notFound();

  const [counts, ideas, recentActivities] = await Promise.all([
    getReportCounts(id),
    prisma.idea.findMany({
      where: { userId: id, saved: true },
      orderBy: { createdAt: "desc" },
      include: { trend: true },
    }),
    prisma.activity.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <Link href="/admin" className="text-sm font-bold text-al-purple hover:underline">
        ← 会員一覧に戻る
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs font-bold tracking-[0.2em] text-al-purple">
            ADMIN
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
            {targetUser.displayName}
          </h1>
          <p className="mt-1 text-sm text-al-gray-500">{targetUser.email}</p>
          <p className="mt-1 text-xs text-al-gray-400">
            登録日: {targetUser.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>
        {targetUser.id !== admin.id && (
          <DeleteUserButton
            userId={targetUser.id}
            email={targetUser.email}
            displayName={targetUser.displayName}
            redirectOnDelete
          />
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "分析した投稿", value: counts.analyzedPosts },
          { label: "保存した企画", value: counts.savedIdeas },
          { label: "参考にした投稿", value: counts.referencedPosts },
          { label: "トレンドチェック", value: counts.trendChecks },
        ].map((stat) => (
          <div key={stat.label} className="al-flyer-card rounded-xl p-4">
            <p className="font-display text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-al-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold">保存済みの企画</h2>
        {ideas.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-al-gray-200 p-6 text-center text-sm text-al-gray-400">
            まだ保存済みの企画がありません。
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {ideas.map((idea) => (
              <article key={idea.id} className="al-flyer-card overflow-hidden rounded-2xl">
                {idea.trend ? (
                  <div className="flex items-center gap-3 border-b-2 border-al-black bg-al-gray-50 px-5 py-3">
                    <span className="font-display text-[11px] font-bold tracking-widest text-al-gray-400">
                      TREND
                    </span>
                    <CategoryTag category={idea.trend.category} />
                    <span className="text-sm font-bold">{idea.trend.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 border-b-2 border-al-black bg-al-gray-50 px-5 py-3">
                    <span className="font-display text-[11px] font-bold tracking-widest text-al-gray-400">
                      ORIGINAL
                    </span>
                    <span className="inline-flex items-center rounded-md bg-al-purple px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-white">
                      オリジナル
                    </span>
                  </div>
                )}
                <div className="px-5 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {idea.persona && (
                      <span className="text-[11px] text-al-gray-400">
                        {PERSONA_LABEL[idea.persona as Persona]}向け
                      </span>
                    )}
                    <span className="text-[11px] text-al-gray-400">
                      {formatRelativeDate(idea.createdAt)}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-xl font-bold leading-snug">
                    {idea.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-al-gray-600">{idea.reason}</p>
                  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      ["冒頭1秒", idea.opening],
                      ["撮影場所", idea.location],
                      ["表情", idea.expression],
                      ["構成", idea.structure],
                      ["尺", idea.duration],
                      ["オチ", idea.punchline],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-al-gray-50 p-3">
                        <dt className="font-display text-xs font-bold text-al-gray-400">
                          {label}
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold">最近のアクティビティ</h2>
        {recentActivities.length === 0 ? (
          <p className="mt-4 rounded-xl border border-al-gray-200 p-4 text-sm text-al-gray-400">
            まだアクティビティがありません。
          </p>
        ) : (
          <ul className="mt-4 space-y-3 border-l-2 border-al-gray-100 pl-4">
            {recentActivities.map((item) => (
              <li key={item.id} className="relative text-sm leading-relaxed">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-al-pink" />
                <span className="mr-2 font-display text-xs font-bold text-al-gray-400">
                  {formatRelativeDate(item.createdAt)}
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
