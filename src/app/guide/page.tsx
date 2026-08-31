import Link from "next/link";
import { navIcons } from "@/components/icons";

type GuideItem = {
  key: string;
  name: string;
  href: string;
  summary: string;
  points: string[];
};

const FLOW = [
  { step: "発見", desc: "TRENDやSONGSで、今伸びているものを知る" },
  { step: "企画", desc: "IDEAやPLAYBOOKで、投稿のネタを見つける" },
  { step: "投稿", desc: "考えた企画で、実際に撮って投稿する" },
  { step: "分析", desc: "ANALYZEで、投稿した動画を振り返る" },
  { step: "記録", desc: "MY REPORTで、これまでの活動を確認する" },
];

const GUIDE_ITEMS: GuideItem[] = [
  {
    key: "TODAY",
    name: "TODAY（ホーム）",
    href: "/",
    summary: "ログインして最初に開く画面です。今日のおすすめと、今のトレンドがまとめて見られます。",
    points: [
      "「あなたへのおすすめ」に、あなたに合いそうな投稿ネタが表示されます",
      "使うほど（企画を保存する・PLAYBOOKをお気に入りにするほど）、おすすめの精度が上がります",
      "他の機能への入り口（NEXT ACTION）もここにまとまっています",
    ],
  },
  {
    key: "TREND",
    name: "TREND（トレンド）",
    href: "/trend",
    summary: "SNSで今伸びている投稿を、ジャンル別に実際のデータで確認できます。",
    points: [
      "カテゴリー（SNS・ファッション・メイクなど）を選んで絞り込めます",
      "カテゴリーを選ぶと、週間ランキングTOP5も見られます",
      "気になる投稿は「この企画をAIに提案してもらう」からIDEAへ進めます",
    ],
  },
  {
    key: "SONGS",
    name: "SONGS（音源ランキング）",
    href: "/songs",
    summary: "今よく使われている音源を、使われ方（踊ってみた・ネタ系・Vlog系・その他）ごとにランキングで見られます。",
    points: [
      "曲名・アーティスト名・元動画へのリンクが確認できます",
      "使われ方のタブで絞り込んで見られます",
    ],
  },
  {
    key: "PLAYBOOK",
    name: "PLAYBOOK（ネタ集）",
    href: "/playbook",
    summary: "スマホ1台でそのまま真似できる投稿の「型」を、210個集めた一覧です。",
    points: [
      "カテゴリーで絞り込むと、今そのジャンルで伸びているトレンドもあわせて見られます",
      "気に入ったネタは☆をタップしてお気に入りに登録できます",
      "ネタの内容はタップでコピーできます",
    ],
  },
  {
    key: "IDEA",
    name: "IDEA（企画のヒント）",
    href: "/idea",
    summary: "AIに投稿企画を考えてもらえます。作り方は2通りあります。",
    points: [
      "「トレンドから」：気になるトレンドを選ぶと、それをもとに企画を1つ提案してくれます",
      "「オリジナル指示で」：投稿するSNS・目的・タイプ・方向性を選ぶと、企画案を3つ提案してくれます",
      "気に入った企画を選ぶと、台本やキャプションまで作ってもらえます",
    ],
  },
  {
    key: "ANALYZE",
    name: "ANALYZE（動画をチェック）",
    href: "/analyze",
    summary: "自分の投稿動画のリンクを貼ると、AIが画角や編集のポイントをチェックしてくれます。",
    points: [
      "YouTubeのリンクなら、AIが動画を実際に見て詳しく分析します",
      "TikTokのリンクは、動画の表示のみ対応しています",
      "ホーム画面の「NEXT ACTION」から開けます",
    ],
  },
  {
    key: "MY REPORT",
    name: "MY REPORT（活動を振り返る）",
    href: "/report",
    summary: "これまでの活動（分析した投稿・保存した企画など）を振り返れます。",
    points: [
      "数字でこれまでの活動量が確認できます",
      "保存した企画を一覧で見返せます",
    ],
  },
  {
    key: "FAQ",
    name: "FAQ（よくある質問）",
    href: "/faq",
    summary: "SNSの専門用語や、初心者向けのコツ、必要な機材、おすすめの編集アプリをまとめています。",
    points: [
      "分からない言葉が出てきたら「専門用語集」タブを見てみましょう",
      "「初心者必見のコツ」「必要な機材」「編集アプリ」もタブで切り替えられます",
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">
      <p className="font-display text-xs font-bold tracking-[0.2em] text-al-blue">GUIDE</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">使い方ガイド</h1>
      <p className="mt-2 max-w-xl text-sm text-al-gray-500">
        ASOBI LABの各機能を簡単にまとめました。迷ったときはこのページを見てみてください。
      </p>

      {/* 使い方の流れ */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold">基本の流れ</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-5">
          {FLOW.map((item, i) => (
            <div key={item.step} className="al-flyer-card rounded-xl p-4">
              <p className="font-display text-xs font-bold text-al-gray-400">STEP {i + 1}</p>
              <p className="mt-1 font-display text-base font-bold">{item.step}</p>
              <p className="mt-1 text-xs leading-relaxed text-al-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 各機能の説明 */}
      <div className="mt-10 space-y-4">
        <h2 className="font-display text-lg font-bold">各機能の使い方</h2>
        {GUIDE_ITEMS.map((item) => {
          const Icon = navIcons[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              className="al-flyer-card block rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                {Icon && (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-al-gray-100">
                    <Icon className="h-5 w-5 text-al-black" />
                  </span>
                )}
                <div>
                  <h3 className="font-display text-base font-bold">{item.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-al-gray-600">{item.summary}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-al-gray-100 pt-3">
                {item.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-xs leading-relaxed text-al-gray-500"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-al-purple" />
                    {point}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
