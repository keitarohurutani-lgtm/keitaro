// ホーム画面「あなたへのおすすめ」用のネタ提案ロジック。
// 実在するデータ（保存済み企画のトレンドカテゴリー・PLAYBOOKのお気に入り）だけから
// 関心の高いカテゴリーを計算し、そのカテゴリーのPLAYBOOKのネタを提案する。
// 使用実績がまだない新規会員には、全カテゴリーから幅広く提案するフォールバックにする
// （実績がないのに「あなた向け」と偽った理由をつけない）。

import { prisma } from "@/lib/prisma";
import { PLAYBOOK_IDEAS, type PlaybookIdea } from "@/lib/playbook";
import { CATEGORIES, isCategory, type Category } from "@/lib/data";

export interface PlaybookRecommendation {
  idea: PlaybookIdea;
  reason: string;
}

const RECOMMENDATION_SIZE = 3;

// 日替わりで提案が変わるように、乱数の代わりに日付＋文字列のハッシュで決定的に選ぶ
// （SSRのたびに変わってしまわないよう、同じ日なら同じ結果になる）。
function pickForDay<T>(items: T[], seed: string): T {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash + dayIndex) % items.length;
  return items[index];
}

export async function getPlaybookRecommendations(userId: string): Promise<PlaybookRecommendation[]> {
  const [ideas, favorites] = await Promise.all([
    prisma.idea.findMany({ where: { userId }, include: { trend: true } }),
    prisma.playbookFavorite.findMany({ where: { userId } }),
  ]);

  // カテゴリーごとの関心度を集計する。お気に入り（明示的な「好き」の意思表示）は
  // AI企画生成（トレンド閲覧のついでの可能性もある）より重みを大きくする。
  const affinity = new Map<Category, number>();
  for (const idea of ideas) {
    // オリジナル指示から生成した企画（trendがnull）はカテゴリーが分からないため対象外。
    if (idea.trend && isCategory(idea.trend.category)) {
      affinity.set(idea.trend.category, (affinity.get(idea.trend.category) ?? 0) + 1);
    }
  }
  for (const fav of favorites) {
    const playbookIdea = PLAYBOOK_IDEAS.find((p) => p.id === fav.playbookIdeaId);
    if (playbookIdea) {
      affinity.set(playbookIdea.category, (affinity.get(playbookIdea.category) ?? 0) + 2);
    }
  }

  const rankedCategories = [...affinity.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);
  // 関心度が分かっているカテゴリーを優先しつつ、3件に満たない場合は残りのカテゴリーで
  // 埋める（関心データが少ない会員でも寂しい表示にならないように）。
  const candidateCategories = [
    ...rankedCategories,
    ...CATEGORIES.filter((c) => !affinity.has(c)),
  ];

  const alreadyFavorited = new Set(favorites.map((f) => f.playbookIdeaId));
  const picks: PlaybookRecommendation[] = [];
  const usedIds = new Set(alreadyFavorited);

  for (const category of candidateCategories) {
    if (picks.length >= RECOMMENDATION_SIZE) break;
    const candidates = PLAYBOOK_IDEAS.filter(
      (p) => p.category === category && !usedIds.has(p.id)
    );
    if (candidates.length === 0) continue;

    const pick = pickForDay(candidates, `${userId}-${category}`);
    usedIds.add(pick.id);
    // そのカテゴリー自体に実際の関心シグナルがある場合だけ、その根拠を正直に表示する。
    picks.push({
      idea: pick,
      reason: affinity.has(category)
        ? `「${category}」をよくチェックしているあなたに`
        : "今日のピックアップ",
    });
  }

  return picks;
}
