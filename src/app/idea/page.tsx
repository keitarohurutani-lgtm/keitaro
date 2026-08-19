import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import IdeaGenerator from "@/components/IdeaGenerator";
import IdeaList from "./IdeaList";
import { getCurrentUserId } from "@/lib/auth";

export default async function IdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ trendId?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { trendId } = await searchParams;

  const [trends, ideas] = await Promise.all([
    prisma.trend.findMany({ orderBy: { fetchedAt: "desc" } }),
    prisma.idea.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { trend: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-pink">IDEA</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
        あなたに合う投稿ネタを見つける
      </h1>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        トレンドをもとに、AIがあなたのキャラクターに合いそうな企画を提案します。正解ではなく候補として、気になるものから試してみましょう。
      </p>

      <div className="mt-8">
        <IdeaGenerator trends={trends} initialTrendId={trendId} />
      </div>

      <IdeaList ideas={ideas} />
    </div>
  );
}
