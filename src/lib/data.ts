export type Category =
  | "SNS"
  | "音源"
  | "ファッション"
  | "メイク"
  | "企画"
  | "TikTok"
  | "Instagram";

export const CATEGORIES: Category[] = [
  "SNS",
  "音源",
  "ファッション",
  "メイク",
  "企画",
  "TikTok",
  "Instagram",
];

export const categoryAccent: Record<Category, string> = {
  SNS: "bg-al-blue",
  音源: "bg-al-purple",
  ファッション: "bg-al-pink",
  メイク: "bg-al-pink",
  企画: "bg-al-purple",
  TikTok: "bg-al-black",
  Instagram: "bg-al-blue",
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as string[]).includes(value);
}

// TRENDページ専用のカテゴリー一覧。「音源」は/songsの専用ランキングに一本化したため、
// TRENDのカテゴリータブからは除外する（PLAYBOOKなど他機能ではCATEGORIESをそのまま使う）。
export const TREND_CATEGORIES: Category[] = CATEGORIES.filter((c) => c !== "音源");

// /songs（音源の週間ランキング）で使う「主な使用用途」の固定選択肢。
// クライアント・サーバー両方から安全に参照できるよう、ここ（サーバー専用処理を含まない
// data.ts）で定義し、src/lib/ai.ts もこれを再利用する。
export const SONG_USAGE_TYPES = ["踊ってみた", "ネタ系", "Vlog系", "その他"] as const;
export type SongUsageType = (typeof SONG_USAGE_TYPES)[number];
