"use client";

import { useState } from "react";

type TabKey = "glossary" | "tips" | "gear" | "apps";

const TABS: { key: TabKey; label: string }[] = [
  { key: "glossary", label: "専門用語集" },
  { key: "tips", label: "初心者必見のコツ" },
  { key: "gear", label: "必要な機材" },
  { key: "apps", label: "編集アプリ" },
];

const GLOSSARY: { term: string; explanation: string }[] = [
  { term: "バズる", explanation: "たくさんの人に見られて、一気に話題になること。" },
  {
    term: "エンゲージメント",
    explanation: "いいね・コメント・シェアなど、見た人が反応してくれた数のこと。",
  },
  { term: "インプレッション", explanation: "投稿が画面に表示された回数のこと。" },
  {
    term: "リーチ",
    explanation: "その投稿を見た人の数のこと（同じ人が2回見ても1人と数える）。",
  },
  { term: "フォロワー", explanation: "あなたのアカウントを登録して、投稿を見てくれる人のこと。" },
  {
    term: "ハッシュタグ",
    explanation: "「#」を付けた言葉。同じ話題の投稿をまとめて探せるようにする目印。",
  },
  {
    term: "アルゴリズム",
    explanation: "どの投稿を誰におすすめするか、SNSアプリが自動で決めているしくみ。",
  },
  { term: "視聴維持率", explanation: "動画を最後まで見てくれた人の割合。" },
  { term: "保存率", explanation: "投稿を「あとで見る」ために保存してくれた人の割合。" },
  {
    term: "プロフィール流入",
    explanation: "投稿を見た人が、あなたのプロフィールページまで来てくれること。",
  },
  {
    term: "リール／ショート動画",
    explanation: "短い縦型の動画のこと（Instagramは「リール」、YouTubeは「ショート」と呼ぶ）。",
  },
  { term: "コラボ投稿", explanation: "他の人と一緒に1つの投稿を作ること。" },
];

const TIPS: string[] = [
  "最初の1〜2秒で「お、なにこれ？」と思ってもらえる場面から始めてみましょう。",
  "毎回だいたい同じ時間帯に投稿すると、見てくれる人が習慣として見に来やすくなります。",
  "コメントには自分の言葉で返事をすると、仲良くなれる人が増えていきます。",
  "完璧を目指さなくて大丈夫。まずは10本投稿してみることを目標にしてみましょう。",
  "人の投稿をたくさん見て、良いと思ったところをメモしておくと、自分の投稿にも活かせます。",
  "縦向き・明るい画面・読みやすい大きさの文字を意識してみましょう。",
  "1つの投稿には1つのテーマだけ。あれこれ詰め込みすぎないようにしましょう。",
  "焦らなくて大丈夫です。3ヶ月くらいは結果を気にしすぎず、続けることを大事にしましょう。",
];

const GEAR: { name: string; note: string }[] = [
  { name: "スマートフォン", note: "今使っているものでOKです。カメラの設定を高画質にしておきましょう。" },
  { name: "三脚・スマホスタンド", note: "手ブレを防いで、安定した映像になります。" },
  { name: "照明（リングライトなど）", note: "顔を明るくきれいに見せてくれます。" },
  { name: "マイク", note: "声をきれいに録りたいときに。最初はスマホ内蔵マイクでも十分です。" },
  { name: "保存容量（SDカード・クラウド保存）", note: "動画はデータが大きいので、容量に余裕を持たせておきましょう。" },
];

const APPS: { name: string; features: string[]; bestFor: string }[] = [
  {
    name: "CapCut",
    features: [
      "TikTokと同じ会社が作っているので、TikTokで流行っている音源・エフェクト・テンプレートにすぐアクセスできる",
      "話した内容を自動でテロップにしてくれる機能がある",
      "無料でも高機能で、透かし（ロゴ）も入らない",
    ],
    bestFor: "TikTok向け。テンプレートに沿って作るだけで、流行りに乗った動画が作りやすいです。",
  },
  {
    name: "VN",
    features: [
      "音や映像を何層にも重ねる細かい編集ができる",
      "色味の調整など、こだわった仕上がりにしやすい",
      "操作はシンプルなまま、機能だけが本格的",
    ],
    bestFor:
      "YouTube向け。じっくり作り込みたい・長めの動画を編集したい人に向いています。",
  },
  {
    name: "InShot",
    features: [
      "正方形・縦長・横長など、投稿先に合わせた画面比率にすぐ変えられる",
      "BGM・効果音の種類が豊富",
      "操作画面が分かりやすく、初めてでも迷いにくい",
    ],
    bestFor:
      "Instagram向け。フィード投稿とリールで比率を変えたいときに扱いやすいです。",
  },
  {
    name: "TikTok／Instagram本体の編集機能",
    features: [
      "アプリを切り替えずに、撮影から投稿までその場で完結する",
      "そのアプリだけの音源・エフェクトに直接アクセスできる",
    ],
    bestFor: "どちらの媒体でも、とにかく手軽にサクッと編集したいときに向いています。",
  },
];

export default function FaqClient() {
  const [tab, setTab] = useState<TabKey>("glossary");

  return (
    <div className="mt-6">
      <div className="al-rail flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-2 font-display text-sm font-bold transition-colors ${
              tab === t.key
                ? "bg-al-black text-white"
                : "bg-al-gray-100 text-al-gray-600 hover:bg-al-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "glossary" && (
          <div className="al-flyer-card divide-y divide-al-gray-100 rounded-2xl">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="p-4">
                <p className="font-display text-sm font-bold">{g.term}</p>
                <p className="mt-1 text-sm leading-relaxed text-al-gray-600">{g.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "tips" && (
          <ul className="space-y-3">
            {TIPS.map((tip, i) => (
              <li
                key={i}
                className="al-flyer-card flex items-start gap-3 rounded-2xl p-4 text-sm leading-relaxed text-al-gray-600"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-al-black font-display text-xs font-bold text-white">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        )}

        {tab === "gear" && (
          <div>
            <p className="mb-4 text-xs text-al-gray-400">
              全部そろえる必要はありません。まずはスマートフォンだけで始めて、必要になったら少しずつ揃えていくので大丈夫です。
            </p>
            <div className="al-flyer-card divide-y divide-al-gray-100 rounded-2xl">
              {GEAR.map((g) => (
                <div key={g.name} className="p-4">
                  <p className="font-display text-sm font-bold">{g.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-al-gray-600">{g.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "apps" && (
          <div>
            <p className="mb-4 text-xs text-al-gray-400">
              どれも無料プランで十分使えます。アプリの機能や仕様は変わることがあるので、実際に開いて確認してみてください。
            </p>
            <div className="space-y-4">
              {APPS.map((a) => (
                <div key={a.name} className="al-flyer-card rounded-2xl p-4">
                  <p className="font-display text-base font-bold">{a.name}</p>
                  <ul className="mt-2 space-y-1">
                    {a.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm leading-relaxed text-al-gray-600"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-al-purple" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 rounded-lg bg-al-gray-50 px-3 py-2 text-xs leading-relaxed text-al-gray-500">
                    <span className="font-display font-bold text-al-black">向いている媒体：</span>
                    {a.bestFor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
