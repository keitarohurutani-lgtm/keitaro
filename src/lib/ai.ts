import { GoogleGenAI } from "@google/genai";
import type { Persona } from "@/generated/prisma/enums";
import { PERSONA_LABEL } from "@/lib/persona";

// 姉妹プロジェクト（asobisystem-news-app）での動作確認により、無料枠のレート制限が
// 「1分あたり15リクエスト」で日次カウントではないFlash-Liteが実用的と判明しているため、
// このモデルに統一する。
const MODEL = "gemini-3.1-flash-lite";

const MIN_CALL_INTERVAL_MS = 4500;
let lastCallAt = 0;

async function pace(): Promise<void> {
  const wait = lastCallAt + MIN_CALL_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

let client: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY が設定されていません。.env.local に設定してください。");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export function describeAiError(err: unknown): string {
  if (err instanceof Error && err.message.includes("GEMINI_API_KEY")) {
    return err.message;
  }
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes('"code":429')) {
    const retryMatch = raw.match(/retryDelay":"(\d+)s"/);
    const wait = retryMatch ? `${retryMatch[1]}秒ほど` : "少し";
    return `AIへのアクセスが集中しています（無料枠のリクエスト数上限）。${wait}待ってからもう一度お試しください。`;
  }
  return "AI企画生成の呼び出しに失敗しました。もう一度お試しください。";
}

export interface GeneratedIdea {
  title: string;
  reason: string;
  opening: string;
  location: string;
  expression: string;
  structure: string;
  duration: string;
  punchline: string;
}

function buildIdeaSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string", description: "『〇〇してみた』のような投稿企画タイトル" },
      reason: {
        type: "string",
        description: "なぜこのキャラクターにこの企画が合うのかの理由（1〜2文、断定しすぎず提案口調で）",
      },
      opening: { type: "string", description: "冒頭1秒で何を見せるか" },
      location: { type: "string", description: "おすすめの撮影場所" },
      expression: { type: "string", description: "意識すべき表情" },
      structure: { type: "string", description: "全体の構成の流れ（矢印でつないだ短い流れ）" },
      duration: { type: "string", description: "おすすめの尺（例: 15〜20秒）" },
      punchline: { type: "string", description: "最後のオチ・締め方" },
    },
    required: [
      "title",
      "reason",
      "opening",
      "location",
      "expression",
      "structure",
      "duration",
      "punchline",
    ],
  };
}

export async function generateIdeaFromTrend(params: {
  trendName: string;
  trendCategory: string;
  trendDescription: string;
  trendWhyHot: string;
  persona: Persona;
}): Promise<GeneratedIdea> {
  const ai = getAiClient();

  const systemInstruction = [
    "あなたはタレントスクール所属者向けSNS活動支援サービス「ASOBI LAB」のAI企画アシスタントです。",
    "SNSに絶対的な正解はないという前提のもと、断定的に『こうすべき』と言うのではなく、",
    "『こんな方法もあります』『試してみませんか？』という提案・発見のトーンで書いてください。",
    "難しい専門用語は避け、10代〜20代のタレント・アイドル志望者・モデル志望者が読んですぐ行動に移せる、",
    "具体的で前向きな内容にしてください。子どもっぽくなりすぎず、おしゃれでカルチャー感のある言葉選びを意識してください。",
    "出力は日本語のみ。事実にない過去の実績や数値を創作しないでください。",
  ].join("\n");

  const userPrompt = [
    `【今伸びているトレンド】${params.trendName}（カテゴリー: ${params.trendCategory}）`,
    `【トレンドの説明】${params.trendDescription}`,
    `【なぜ注目されているか】${params.trendWhyHot}`,
    `【企画を提案する相手のキャラクター】${PERSONA_LABEL[params.persona]}`,
    "上記のトレンドとキャラクターをもとに、この人に合いそうな『〇〇してみた』形式の投稿企画を1つ提案してください。",
    "POST PLAN（冒頭1秒・撮影場所・表情・構成・尺・オチ）も具体的に埋めてください。",
  ].join("\n");

  await pace();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: buildIdeaSchema(),
    },
  });

  const text = response.text;
  if (!text) throw new Error("AIによる企画生成に失敗しました。");
  const parsed = JSON.parse(text);

  return {
    title: String(parsed.title ?? ""),
    reason: String(parsed.reason ?? ""),
    opening: String(parsed.opening ?? ""),
    location: String(parsed.location ?? ""),
    expression: String(parsed.expression ?? ""),
    structure: String(parsed.structure ?? ""),
    duration: String(parsed.duration ?? ""),
    punchline: String(parsed.punchline ?? ""),
  };
}

export interface TrendSummary {
  category: string;
  description: string;
  whyHot: string;
  howToUse: string;
  artistName: string | null;
  songTitle: string | null;
}

function buildTrendSummarySchema(categories: readonly string[]) {
  return {
    type: "object",
    properties: {
      category: { type: "string", enum: [...categories] },
      description: { type: "string", description: "この動画が示すトレンドの説明（1文）" },
      whyHot: { type: "string", description: "なぜ今注目されているか（1〜2文）" },
      howToUse: { type: "string", description: "タレントが投稿に取り入れる際のおすすめの使い方（1〜2文）" },
      artistName: {
        type: "string",
        description:
          "カテゴリーが「音源」で、動画タイトル・チャンネル名から歌手/アーティスト名が読み取れる場合のみ記入。読み取れない、または音源カテゴリでない場合は空文字。",
      },
      songTitle: {
        type: "string",
        description:
          "カテゴリーが「音源」で、動画タイトルから曲名が読み取れる場合のみ記入。読み取れない、または音源カテゴリでない場合は空文字。",
      },
    },
    required: ["category", "description", "whyHot", "howToUse", "artistName", "songTitle"],
  };
}

// 実際にYouTubeで再生数が伸びている動画のタイトル・説明文というリアルな一次情報を渡し、
// そこから「なぜ注目されているか」「どう取り入れるか」というASOBI LABらしい解説文をAIに
// 生成させる。動画の内容自体は創作せず、与えられた実データの範囲で要約させる。
export async function summarizeYoutubeTrend(params: {
  videoTitle: string;
  videoDescription: string;
  channelTitle: string;
  categories: readonly string[];
}): Promise<TrendSummary> {
  const ai = getAiClient();

  const systemInstruction = [
    "あなたはタレント向けSNS支援サービス「ASOBI LAB」のトレンド分析AIです。",
    "実際にYouTubeで再生数が伸びている動画の情報をもとに、タレントスクール所属者向けに",
    "『なぜ注目されているか』『どう投稿に取り入れるか』を提案口調（断定しない）で短くまとめてください。",
    "動画に書かれていない事実を創作しないでください。情報が不足する場合は一般的な傾向として書いてください。",
    "カテゴリーが「音源」の場合のみ、動画タイトル・チャンネル名から歌手/アーティスト名と曲名を",
    "読み取れる範囲で抽出してください（読み取れない場合や音源カテゴリでない場合は空文字にする）。",
  ].join("\n");

  const userPrompt = [
    `【動画タイトル】${params.videoTitle}`,
    `【チャンネル名】${params.channelTitle}`,
    `【動画の説明文（一部）】${params.videoDescription.slice(0, 400)}`,
    `【カテゴリー候補】${params.categories.join("、")}`,
    "この動画が属する最も近いカテゴリーを1つ選び、トレンドの説明・注目理由・使い方をまとめてください。",
  ].join("\n");

  await pace();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 512,
      responseMimeType: "application/json",
      responseSchema: buildTrendSummarySchema(params.categories),
    },
  });

  const text = response.text;
  if (!text) throw new Error("AIによるトレンド要約に失敗しました。");
  const parsed = JSON.parse(text);

  return {
    category: params.categories.includes(parsed.category) ? parsed.category : params.categories[0],
    description: String(parsed.description ?? ""),
    whyHot: String(parsed.whyHot ?? ""),
    howToUse: String(parsed.howToUse ?? ""),
    artistName: parsed.artistName ? String(parsed.artistName) : null,
    songTitle: parsed.songTitle ? String(parsed.songTitle) : null,
  };
}

export interface SongInfo {
  artistName: string | null;
  songTitle: string | null;
}

function buildSongInfoSchema() {
  return {
    type: "object",
    properties: {
      artistName: {
        type: "string",
        description: "動画タイトル・チャンネル名から読み取れる歌手/アーティスト名。読み取れない場合は空文字。",
      },
      songTitle: {
        type: "string",
        description: "動画タイトルから読み取れる曲名。読み取れない場合は空文字。",
      },
    },
    required: ["artistName", "songTitle"],
  };
}

// 週間ランキングの音源カテゴリー2〜5位用。summarizeYoutubeTrendより軽量な
// アーティスト名・曲名の抽出のみを行う（1位はsummarizeYoutubeTrendの結果を流用するため呼ばない）。
export async function extractSongInfo(params: {
  videoTitle: string;
  channelTitle: string;
}): Promise<SongInfo> {
  const ai = getAiClient();

  const systemInstruction = [
    "あなたは音源トレンド分析AIです。動画タイトルとチャンネル名から、歌手/アーティスト名と曲名を",
    "読み取れる範囲で抽出してください。書かれていない情報を創作しないでください。",
    "読み取れない場合は空文字にしてください。",
  ].join("\n");

  const userPrompt = [
    `【動画タイトル】${params.videoTitle}`,
    `【チャンネル名】${params.channelTitle}`,
  ].join("\n");

  await pace();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 128,
      responseMimeType: "application/json",
      responseSchema: buildSongInfoSchema(),
    },
  });

  const text = response.text;
  if (!text) return { artistName: null, songTitle: null };
  const parsed = JSON.parse(text);

  return {
    artistName: parsed.artistName ? String(parsed.artistName) : null,
    songTitle: parsed.songTitle ? String(parsed.songTitle) : null,
  };
}
