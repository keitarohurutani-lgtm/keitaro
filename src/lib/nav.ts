export type NavItem = {
  href: string;
  label: string;
  sub: string;
};

// ヘッダー・ボトムナビ非表示、メインの余白なしを揃えるページ
export const AUTH_PATHS = new Set(["/login", "/register"]);

export const desktopNav: NavItem[] = [
  { href: "/", label: "TODAY", sub: "今日のアクション" },
  { href: "/trend", label: "TREND", sub: "トレンド" },
  { href: "/idea", label: "IDEA", sub: "企画のヒント" },
  { href: "/analyze?tab=benchmark", label: "BENCHMARK", sub: "比較する" },
  { href: "/analyze?tab=check", label: "ANALYZE", sub: "動画をチェック" },
  { href: "/report", label: "MY REPORT", sub: "活動を振り返る" },
];

export const mobileNav: NavItem[] = [
  { href: "/", label: "TODAY", sub: "今日" },
  { href: "/trend", label: "TREND", sub: "トレンド" },
  { href: "/idea", label: "IDEA", sub: "企画" },
  { href: "/analyze", label: "ANALYZE", sub: "分析" },
  { href: "/report", label: "MY", sub: "マイ" },
];
