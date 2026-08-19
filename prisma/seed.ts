import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
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
    category: "音源",
    name: "ローファイ切なEDM",
    description: "サビ前の溜めが強調された楽曲が縦型動画で急増中。",
    whyHot: "感情の切り替わりが分かりやすく、表情芸と相性がいい。",
    howToUse: "サビ頭で表情やポーズを切り替える『落差』を作ると伸びやすい。",
    growth: "+210%",
    thumbnailFrom: "#7C5CFF",
    thumbnailTo: "#D4FF3D",
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
    category: "音源",
    name: "新曲サビ縦ダンス",
    description: "リリース直後の新曲サビ部分をシンプルな振り付けで踊る投稿。",
    whyHot: "楽曲側のリーチとも重なり、両方のアルゴリズムから流入しやすい。",
    howToUse: "振りは覚えやすい8カウントに絞り、目線を強めに。",
    growth: "+183%",
    thumbnailFrom: "#FF2E8B",
    thumbnailTo: "#7C5CFF",
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

async function main() {
  const existing = await prisma.trend.count({ where: { source: "SEED" } });
  if (existing > 0) {
    console.log(`SEEDトレンドは既に${existing}件あるためスキップします。`);
    return;
  }

  for (const trend of SEED_TRENDS) {
    await prisma.trend.create({
      data: { ...trend, source: "SEED" },
    });
  }

  console.log(`${SEED_TRENDS.length}件のトレンドをシードしました。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
