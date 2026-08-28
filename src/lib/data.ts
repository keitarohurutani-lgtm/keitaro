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
