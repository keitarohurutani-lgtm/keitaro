// SNSコンテンツ提案機能（IDEAページ「オリジナル指示で」モード）の内部データ構造。
// 画面の表示文言とAIに渡す内部値を分離し、文言を変えてもAI側ロジックが壊れないようにする。

export const PLATFORMS = ["tiktok", "instagram", "x", "youtube"] as const;
export type Platform = (typeof PLATFORMS)[number];
export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
};

export const INSTAGRAM_FORMATS = ["reel", "feed", "story"] as const;
export type InstagramFormat = (typeof INSTAGRAM_FORMATS)[number];
export const INSTAGRAM_FORMAT_LABEL: Record<InstagramFormat, string> = {
  reel: "リール",
  feed: "フィード投稿",
  story: "ストーリーズ",
};

export const OBJECTIVES = [
  "reach",
  "follow",
  "fan",
  "personal_branding",
  "engagement",
  "announcement",
  "conversion",
] as const;
export type Objective = (typeof OBJECTIVES)[number];
export const OBJECTIVE_LABEL: Record<Objective, string> = {
  reach: "たくさんの人に見てもらいたい",
  follow: "フォロワーを増やしたい",
  fan: "ファンになってもらいたい",
  personal_branding: "自分のことを知ってほしい",
  engagement: "コメントや反応を増やしたい",
  announcement: "告知したい",
  conversion: "商品やサービスにつなげたい",
};

export const CONTENT_TYPES = [
  "talk",
  "trend",
  "entertainment",
  "story",
  "howto",
  "vlog",
  "performance",
  "photo",
  "auto",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  talk: "トーク動画",
  trend: "音源・トレンド動画",
  entertainment: "ネタ・企画動画",
  story: "ストーリー・体験談",
  howto: "ノウハウ・HowTo",
  vlog: "Vlog・日常",
  performance: "歌・ダンス・パフォーマンス",
  photo: "写真・画像投稿",
  auto: "AIにおまかせ",
};

export const DIRECTIONS = [
  "viral",
  "empathy",
  "funny",
  "appeal",
  "fan_communication",
  "save",
  "comment",
  "character",
  "auto",
] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const DIRECTION_LABEL: Record<Direction, string> = {
  viral: "バズを狙いたい",
  empathy: "共感されたい",
  funny: "面白くしたい",
  appeal: "自分の魅力を見せたい",
  fan_communication: "ファンとの距離を縮めたい",
  save: "保存される投稿にしたい",
  comment: "コメントされる投稿にしたい",
  character: "自分のキャラクターを伝えたい",
  auto: "AIにおまかせ",
};
export const MAX_DIRECTIONS = 3;

export interface ContentRequest {
  platform: Platform;
  instagramFormat?: InstagramFormat;
  objective: Objective;
  contentType: ContentType;
  direction: Direction[];
  additionalRequest?: string;
}

export const MAX_ADDITIONAL_REQUEST_LENGTH = 300;

// このアプリには活動ジャンル・目標・ターゲット層・強みなどを保存するプロフィール機能が
// まだ存在しない。実在するのは「あなたのタイプ」（persona、ブラウザのlocalStorage保存）
// だけなので、それだけをbrandImageとして渡す。存在しない項目は空のまま（推測で埋めない）。
export interface CreatorProfile {
  brandImage?: string;
}

export interface ContentProposal {
  title: string;
  purpose: string;
  concept: string;
  hook: string;
  structure: string;
  duration: string;
  difficulty: string;
  reason: string;
}

export const FOLLOWUP_ACTIONS = ["script", "structure", "caption", "shooting"] as const;
export type FollowUpAction = (typeof FOLLOWUP_ACTIONS)[number];
export const FOLLOWUP_ACTION_LABEL: Record<FollowUpAction, string> = {
  script: "台本を作る",
  structure: "詳しい構成を作る",
  caption: "キャプションを作る",
  shooting: "撮影方法を見る",
};

export interface ScriptCut {
  timeRange: string;
  dialogue: string;
  telop: string;
  camera: string;
}

export interface FollowUpResult {
  actionType: FollowUpAction;
  cuts?: ScriptCut[];
  text?: string;
}
