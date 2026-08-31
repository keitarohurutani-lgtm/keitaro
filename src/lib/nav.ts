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
  { href: "/songs", label: "SONGS", sub: "音源ランキング" },
  { href: "/playbook", label: "PLAYBOOK", sub: "ネタ集" },
  { href: "/idea", label: "IDEA", sub: "企画のヒント" },
  { href: "/report", label: "MY REPORT", sub: "活動を振り返る" },
  { href: "/faq", label: "FAQ", sub: "よくある質問" },
];

export const mobileNav: NavItem[] = [
  { href: "/", label: "TODAY", sub: "今日" },
  { href: "/trend", label: "TREND", sub: "トレンド" },
  { href: "/songs", label: "SONGS", sub: "音源" },
  { href: "/playbook", label: "PLAYBOOK", sub: "ネタ集" },
  { href: "/idea", label: "IDEA", sub: "企画" },
  { href: "/report", label: "MY", sub: "マイ" },
  { href: "/faq", label: "FAQ", sub: "質問" },
];
