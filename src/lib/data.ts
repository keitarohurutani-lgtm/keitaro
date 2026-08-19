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

// POST CHECK / BENCHMARK は実際の動画AI解析（映像フレーム分析）を伴わないため、
// アクションのログ（DB保存）は実データだが、分析結果自体は一貫したサンプル内容を返す。
// 画面上には常に「AIによる参考分析です」の注意書きを表示すること。

export type BenchmarkVideo = {
  id: string;
  label: "あなたの投稿" | "参考投稿";
  title: string;
  creator: string;
  thumbnailFrom: string;
  thumbnailTo: string;
  metrics: {
    opening: number;
    structure: number;
    framing: number;
    expression: number;
    tempo: number;
    editing: number;
  };
  note: string;
};

export const benchmarkPair: { mine: BenchmarkVideo; reference: BenchmarkVideo } = {
  mine: {
    id: "my-post-0142",
    label: "あなたの投稿",
    title: "カフェ巡り朝ルーティン",
    creator: "あなたの投稿 (8/10)",
    thumbnailFrom: "#0B0B0C",
    thumbnailTo: "#52525b",
    metrics: {
      opening: 48,
      structure: 62,
      framing: 70,
      expression: 58,
      tempo: 54,
      editing: 66,
    },
    note: "冒頭2秒が状況説明から始まっており、視聴維持率が落ちやすい構成です。",
  },
  reference: {
    id: "ref-post-0091",
    label: "参考投稿",
    title: "朝ルーティン『5分で外出』",
    creator: "参考にしたい投稿",
    thumbnailFrom: "#FF2E8B",
    thumbnailTo: "#7C5CFF",
    metrics: {
      opening: 88,
      structure: 84,
      framing: 79,
      expression: 90,
      tempo: 81,
      editing: 77,
    },
    note: "開始0.5秒で結果（外出直前の姿）を見せてから経緯に戻る『結論ファースト』構成です。",
  },
};

export const benchmarkNextActions = [
  "冒頭1秒目を『経緯』ではなく『結果カット』に変えてみましょう。",
  "表情の切り替わりポイントをテロップで一瞬止めて強調してみましょう。",
  "テンポが均一なので、山場だけカットを短くしてメリハリをつけてみましょう。",
];

export type PostCheckCut = {
  index: number;
  label: string;
  timestamp: string;
  score: "◎" | "○" | "△";
  comment: string;
};

export const postCheckCuts: PostCheckCut[] = [
  {
    index: 1,
    label: "冒頭の掴み",
    timestamp: "0:00-0:02",
    score: "△",
    comment: "状況説明から入っており、結論や画になるカットが後回しになっています。",
  },
  {
    index: 2,
    label: "画角",
    timestamp: "0:02-0:05",
    score: "○",
    comment: "バストアップで安定していますが、途中で視線がフレーム外に外れています。",
  },
  {
    index: 3,
    label: "表情",
    timestamp: "0:05-0:09",
    score: "◎",
    comment: "自然な笑顔の変化があり、感情の起伏が伝わりやすいカットです。",
  },
  {
    index: 4,
    label: "構成の展開",
    timestamp: "0:09-0:14",
    score: "○",
    comment: "情報の順序は良いですが、間（ま）がやや長く感じられる箇所があります。",
  },
  {
    index: 5,
    label: "テンポ",
    timestamp: "0:14-0:18",
    score: "△",
    comment: "カットの長さが均一で、山場が視覚的に伝わりにくくなっています。",
  },
  {
    index: 6,
    label: "見せ方・オチ",
    timestamp: "0:18-0:22",
    score: "○",
    comment: "着地の一言はありますが、最後のカットがやや長めです。",
  },
];
