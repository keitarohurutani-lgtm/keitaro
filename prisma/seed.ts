import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import { getWeekStart } from "../src/lib/week";
import { formatViewCount } from "../src/lib/sources/youtube";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_TRENDS = [
  {
    category: "企画",
    name: "現場密着ビハインド",
    description: "撮影や稽古の裏側を素の表情でそのまま見せるスタイル。",
    whyHot: "作り込まれた投稿に疲れた視聴者が『素の距離感』を求めている。",
    howToUse: "移動中や本番前の1分だけを切り取り、キャプションは短く一言で。",
    growth: "+128%",
    thumbnailFrom: "#0B0B0C",
    thumbnailTo: "#2F7DFF",
  },
  {
    category: "メイク",
    name: "1点直しメイク",
    description: "フルメイクではなく『眉だけ』『涙袋だけ』を10秒で直す動画。",
    whyHot: "時短・実用性が高く、保存されやすいフォーマット。",
    howToUse: "ビフォーを2秒だけ見せて、直す工程にテンポよく入る。",
    growth: "+96%",
    thumbnailFrom: "#FF2E8B",
    thumbnailTo: "#0B0B0C",
  },
  {
    category: "ファッション",
    name: "配色チャレンジ",
    description: "手持ちの服だけで指定カラー3色コーデを即興で組む企画。",
    whyHot: "『自分ならどうする』の参加感が生まれ、コメントが伸びる。",
    howToUse: "制限時間を画面に出す、カウントダウン演出が効果的。",
    growth: "+74%",
    thumbnailFrom: "#0B0B0C",
    thumbnailTo: "#FF2E8B",
  },
  {
    category: "TikTok",
    name: "リアクション二重投稿",
    description: "他人の投稿を見た瞬間の反応をノーカットで撮る形式。",
    whyHot: "編集感がなく『素』が伝わるため信頼感が出やすい。",
    howToUse: "画面の隅に元動画を小さく配置し、リアクションを主役にする。",
    growth: "+152%",
    thumbnailFrom: "#2F7DFF",
    thumbnailTo: "#7C5CFF",
  },
  {
    category: "Instagram",
    name: "質問箱の即答ストーリー",
    description: "受け取った質問にその場でノーカット即答する形式。",
    whyHot: "台本なしのリアルさがフォロワーとの距離を縮める。",
    howToUse: "1本15秒以内、質問→即答→一言オチのテンポを守る。",
    growth: "+61%",
    thumbnailFrom: "#D4FF3D",
    thumbnailTo: "#0B0B0C",
  },
  {
    category: "SNS",
    name: "縦型ドキュメント投稿",
    description: "1枚の画像に文字を詰め込む『読ませる』フォーマットが復権。",
    whyHot: "保存率が高く、プロフィール流入のきっかけになりやすい。",
    howToUse: "1枚目は結論、2〜4枚目で理由、最後に一言まとめ。",
    growth: "+58%",
    thumbnailFrom: "#0B0B0C",
    thumbnailTo: "#A1A1AA",
  },
];

// 週間ランキングのサンプルデータ。sourceUrl/thumbnailUrlは実在しないリンクを捏造しないため
// あえて設定しない（UI側はsourceUrlがnullの場合リンクを表示しない）。
const SEED_RANKINGS: Record<
  (typeof SEED_TRENDS)[number]["category"],
  Array<{
    title: string;
    channelTitle: string;
    viewCount: number;
    artistName?: string;
    songTitle?: string;
  }>
> = {
  TikTok: [
    { title: "リアクション二重投稿フォーマット", channelTitle: "サンプルクリエイターA", viewCount: 389000 },
    { title: "3秒だけ見せる予告カット", channelTitle: "サンプルクリエイターB", viewCount: 301000 },
    { title: "コメント返信をそのまま動画化", channelTitle: "サンプルクリエイターC", viewCount: 256000 },
    { title: "縦画面2分割の対比構成", channelTitle: "サンプルクリエイターD", viewCount: 190000 },
    { title: "音ハメ加工トランジション", channelTitle: "サンプルクリエイターE", viewCount: 133000 },
  ],
  SNS: [
    { title: "縦型ドキュメント投稿フォーマット", channelTitle: "サンプルアカウントA", viewCount: 276000 },
    { title: "保存されやすい1枚完結ポスト", channelTitle: "サンプルアカウントB", viewCount: 224000 },
    { title: "プロフィール流入狙いの結論ファースト構成", channelTitle: "サンプルアカウントC", viewCount: 187000 },
    { title: "コメント欄を煽らない共感型キャプション", channelTitle: "サンプルアカウントD", viewCount: 151000 },
    { title: "文字を詰め込む『読ませる』投稿", channelTitle: "サンプルアカウントE", viewCount: 109000 },
  ],
  ファッション: [
    { title: "指定カラー3色配色チャレンジ", channelTitle: "サンプルスタイリストA", viewCount: 244000 },
    { title: "手持ち服だけの即興コーデ", channelTitle: "サンプルスタイリストB", viewCount: 198000 },
    { title: "1コーデ3パターン変換", channelTitle: "サンプルスタイリストC", viewCount: 165000 },
    { title: "季節先取りレイヤードコーデ", channelTitle: "サンプルスタイリストD", viewCount: 132000 },
    { title: "小物だけで印象チェンジ", channelTitle: "サンプルスタイリストE", viewCount: 98000 },
  ],
  メイク: [
    { title: "1点直しメイクで時短", channelTitle: "サンプルメイクアップA", viewCount: 231000 },
    { title: "涙袋だけ10秒メイク", channelTitle: "サンプルメイクアップB", viewCount: 187000 },
    { title: "ビフォーアフター2秒切り替え", channelTitle: "サンプルメイクアップC", viewCount: 156000 },
    { title: "崩れ直しルーティン", channelTitle: "サンプルメイクアップD", viewCount: 121000 },
    { title: "眉だけチェンジで印象アップ", channelTitle: "サンプルメイクアップE", viewCount: 94000 },
  ],
  企画: [
    { title: "現場密着ビハインド企画", channelTitle: "サンプル企画チームA", viewCount: 213000 },
    { title: "移動中1分だけの素の表情", channelTitle: "サンプル企画チームB", viewCount: 176000 },
    { title: "本番前カウントダウン密着", channelTitle: "サンプル企画チームC", viewCount: 143000 },
    { title: "スタッフ目線の裏側公開", channelTitle: "サンプル企画チームD", viewCount: 112000 },
    { title: "台本なし雑談ビハインド", channelTitle: "サンプル企画チームE", viewCount: 87000 },
  ],
  Instagram: [
    { title: "質問箱の即答ストーリー", channelTitle: "サンプルアカウントF", viewCount: 198000 },
    { title: "15秒質問→即答→オチ形式", channelTitle: "サンプルアカウントG", viewCount: 164000 },
    { title: "台本なしリール即興トーク", channelTitle: "サンプルアカウントH", viewCount: 137000 },
    { title: "ストーリーズ投票企画", channelTitle: "サンプルアカウントI", viewCount: 108000 },
    { title: "コメント欄そのまま朗読", channelTitle: "サンプルアカウントJ", viewCount: 82000 },
  ],
};

async function main() {
  const existing = await prisma.trend.count({ where: { source: "SEED" } });
  if (existing > 0) {
    console.log(`SEEDトレンドは既に${existing}件あるためスキップします。`);
  } else {
    for (const trend of SEED_TRENDS) {
      await prisma.trend.create({
        data: { ...trend, source: "SEED" },
      });
    }
    console.log(`${SEED_TRENDS.length}件のトレンドをシードしました。`);
  }

  const existingRankings = await prisma.trendRanking.count();
  if (existingRankings > 0) {
    console.log(`週間ランキングは既に${existingRankings}件あるためスキップします。`);
    return;
  }

  const weekOf = getWeekStart(new Date());
  let rankingCount = 0;
  for (const [category, items] of Object.entries(SEED_RANKINGS)) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await prisma.trendRanking.create({
        data: {
          category,
          weekOf,
          rank: i + 1,
          title: item.title,
          channelTitle: item.channelTitle,
          artistName: item.artistName ?? null,
          songTitle: item.songTitle ?? null,
          viewCount: item.viewCount,
          growth: formatViewCount(item.viewCount),
          publishedAt: new Date(),
        },
      });
      rankingCount++;
    }
  }
  console.log(`${rankingCount}件の週間ランキング（サンプル）をシードしました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
