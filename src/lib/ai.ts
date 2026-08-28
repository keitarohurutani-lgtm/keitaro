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

export function describeVideoAnalysisError(err: unknown): string {
  if (err instanceof Error && err.message.includes("GEMINI_API_KEY")) {
    return err.message;
  }
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes('"code":429')) {
    const retryMatch = raw.match(/retryDelay":"(\d+)s"/);
    const wait = retryMatch ? `${retryMatch[1]}秒ほど` : "少し";
    return `AIへのアクセスが集中しています（無料枠のリクエスト数上限）。${wait}待ってからもう一度お試しください。`;
  }
  if (raw.includes("INVALID_ARGUMENT") || raw.includes('"code":400')) {
    return "この動画を読み込めませんでした。今のところYouTubeのリンクのみ対応しています（TikTok/Instagramは非対応）。URLが正しいか、動画が公開設定になっているかもご確認ください。";
  }
  return "動画の分析に失敗しました。もう一度お試しください。";
}

// GeminiのfileData.fileUriはYouTubeのURLのみ動画として直接読み込める
// （TikTok/Instagramの動画URLは400 INVALID_ARGUMENTになることを確認済み）。
export function isSupportedVideoUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return /(^|\.)(youtube\.com|youtu\.be)$/.test(hostname);
  } catch {
    return false;
  }
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
    "ただし『理由』などの説明文は、専門用語や難しい言い回しを避け、小学校高学年でも意味が分かるくらい",
    "平易な言葉・短い文で書いてください（企画タイトルなど言葉選びのセンスが大事な部分は今まで通りで構いません）。",
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
  searchKeywords: string[];
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
      searchKeywords: {
        type: "array",
        items: { type: "string" },
        description:
          "このトレンドに関連する参考投稿をTikTok/Instagram/YouTubeで探すのに使える検索キーワード・ハッシュタグ案を3〜5個。" +
          "動画タイトル・チャンネル名から実際に読み取れる語（曲名・振り付け名・チャレンジ名など）を優先し、" +
          "読み取れない場合のみ、カテゴリーやジャンルから一般的に使われそうな検索語を補う。日本語中心、" +
          "ハッシュタグは#を付けて表記。",
      },
    },
    required: [
      "category",
      "description",
      "whyHot",
      "howToUse",
      "artistName",
      "songTitle",
      "searchKeywords",
    ],
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
    "また、タレントがこのトレンドの参考投稿をTikTok/Instagram/YouTubeで自分でも探せるよう、",
    "検索キーワード・ハッシュタグ案も3〜5個添えてください。",
    "専門用語や難しい言い回しを避け、小学校高学年でも意味が分かるくらい平易な言葉・短い文で書いてください。",
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
    searchKeywords: Array.isArray(parsed.searchKeywords)
      ? parsed.searchKeywords.map((k: unknown) => String(k)).filter(Boolean)
      : [],
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

// YouTubeの動画IDを取り出す（サムネイル表示用）。取り出せない場合はnull。
export function extractYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export interface VideoAnalysisCut {
  label: string;
  timestamp: string;
  score: "◎" | "○" | "△";
  comment: string;
}

export interface VideoAnalysisResult {
  videoTitle: string;
  overallComment: string;
  cuts: VideoAnalysisCut[];
}

function buildVideoAnalysisSchema() {
  return {
    type: "object",
    properties: {
      videoTitle: { type: "string", description: "動画の内容が伝わる短いタイトル（10〜20文字程度）" },
      overallComment: {
        type: "string",
        description: "動画全体の印象・良い点・改善できそうな点を2〜3文で（提案口調、断定しない）",
      },
      cuts: {
        type: "array",
        minItems: 3,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "そのカットの内容を表す短い見出し（例: 冒頭の掴み）" },
            timestamp: { type: "string", description: "実際の時間帯（例: 0:00-0:03）" },
            score: { type: "string", enum: ["◎", "○", "△"], description: "◎=良い, ○=普通, △=改善余地あり" },
            comment: {
              type: "string",
              description: "そのカットで実際に見える画角・カメラワーク・カット割り・編集（テロップ、BGM、トランジション等）を具体的に説明",
            },
          },
          required: ["label", "timestamp", "score", "comment"],
        },
        description: "動画を実際の時間経過に沿って3〜6個のカット・場面に分け、それぞれを画角・編集の観点で評価",
      },
    },
    required: ["videoTitle", "overallComment", "cuts"],
  };
}

// 実際にYouTube動画をGeminiに読み込ませ、画角・カット割り・編集スタイルを分析する。
// 動画に映っていない内容を創作しないよう、実際に観測できることのみ書くよう指示する。
export async function analyzeVideoFromUrl(videoUrl: string): Promise<VideoAnalysisResult> {
  const ai = getAiClient();

  const systemInstruction = [
    "あなたはタレント向けSNS支援サービス「ASOBI LAB」の動画分析AIです。",
    "実際に渡された動画を最初から最後まで見て、時間経過に沿ってカット・場面に分け、",
    "それぞれの画角（カメラの距離・角度）、カット割り、編集（テロップ・BGM・トランジション等）を",
    "具体的に説明してください。",
    "動画に実際に映っていないことは書かないでください。断定的な『こうすべき』ではなく、",
    "『こういう工夫もあります』という提案口調で、小学生でも分かる易しい言葉で書いてください。",
  ].join("\n");

  await pace();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { fileData: { fileUri: videoUrl } },
          { text: "この動画を分析してください。" },
        ],
      },
    ],
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 1536,
      responseMimeType: "application/json",
      responseSchema: buildVideoAnalysisSchema(),
    },
  });

  const text = response.text;
  if (!text) throw new Error("AIによる動画分析に失敗しました。");
  const parsed = JSON.parse(text);

  return {
    videoTitle: String(parsed.videoTitle ?? "動画分析結果"),
    overallComment: String(parsed.overallComment ?? ""),
    cuts: Array.isArray(parsed.cuts)
      ? parsed.cuts.map((c: { label?: unknown; timestamp?: unknown; score?: unknown; comment?: unknown }) => ({
          label: String(c.label ?? ""),
          timestamp: String(c.timestamp ?? ""),
          score: (["◎", "○", "△"] as const).includes(c.score as "◎" | "○" | "△")
            ? (c.score as "◎" | "○" | "△")
            : "○",
          comment: String(c.comment ?? ""),
        }))
      : [],
  };
}

export interface VideoComparisonMetrics {
  opening: number;
  structure: number;
  framing: number;
  expression: number;
  tempo: number;
  editing: number;
}

export interface VideoComparisonSide {
  title: string;
  metrics: VideoComparisonMetrics;
  note: string;
}

export interface VideoComparisonResult {
  myVideo: VideoComparisonSide;
  referenceVideo: VideoComparisonSide;
  nextActions: string[];
}

function buildVideoComparisonSchema() {
  const sideSchema = {
    type: "object",
    properties: {
      title: { type: "string", description: "動画の内容が伝わる短いタイトル" },
      metrics: {
        type: "object",
        properties: {
          opening: { type: "number", description: "冒頭の掴みの強さ（0〜100の参考スコア）" },
          structure: { type: "number", description: "構成の分かりやすさ（0〜100の参考スコア）" },
          framing: { type: "number", description: "画角・カメラワークの良さ（0〜100の参考スコア）" },
          expression: { type: "number", description: "表情・感情表現の豊かさ（0〜100の参考スコア）" },
          tempo: { type: "number", description: "テンポの良さ（0〜100の参考スコア）" },
          editing: { type: "number", description: "編集（テロップ・BGM・トランジション）の質（0〜100の参考スコア）" },
        },
        required: ["opening", "structure", "framing", "expression", "tempo", "editing"],
      },
      note: { type: "string", description: "この動画の特徴を1〜2文で（提案口調）" },
    },
    required: ["title", "metrics", "note"],
  };
  return {
    type: "object",
    properties: {
      myVideo: sideSchema,
      referenceVideo: sideSchema,
      nextActions: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 4,
        description: "2つの動画の違いから、自分の動画をどう改善できそうかの具体的な次の一歩を2〜4個",
      },
    },
    required: ["myVideo", "referenceVideo", "nextActions"],
  };
}

// 2本のYouTube動画（自分の投稿・参考にしたい投稿）を実際にGeminiに見比べさせ、
// 冒頭・構成・画角・表情・テンポ・編集の観点でスコア化して比較する。
// スコアはAIによる参考評価であり、絶対的な採点基準ではない旨をUI側で明示すること。
export async function compareVideosFromUrls(
  myVideoUrl: string,
  referenceVideoUrl: string
): Promise<VideoComparisonResult> {
  const ai = getAiClient();

  const systemInstruction = [
    "あなたはタレント向けSNS支援サービス「ASOBI LAB」の動画分析AIです。",
    "2本の動画を実際に見比べて、冒頭の掴み・構成・画角・表情・テンポ・編集の6項目それぞれを",
    "0〜100の参考スコアで評価してください。スコアは厳密な採点ではなく、2本を比べたときの",
    "相対的な目安として付けてください。",
    "最後に、2本の違いから見えてくる改善の次の一歩を、断定的な『こうすべき』ではなく",
    "『こういう工夫もあります』という提案口調で、小学生でも分かる易しい言葉で書いてください。",
  ].join("\n");

  const userPrompt =
    "1本目の動画（myVideo）が「自分の投稿」、2本目の動画（referenceVideo）が「参考にしたい投稿」です。";

  await pace();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: userPrompt },
          { fileData: { fileUri: myVideoUrl } },
          { fileData: { fileUri: referenceVideoUrl } },
        ],
      },
    ],
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: buildVideoComparisonSchema(),
    },
  });

  const text = response.text;
  if (!text) throw new Error("AIによる動画比較に失敗しました。");
  const parsed = JSON.parse(text);

  const toSide = (side: {
    title?: unknown;
    metrics?: Partial<VideoComparisonMetrics>;
    note?: unknown;
  }): VideoComparisonSide => ({
    title: String(side.title ?? ""),
    metrics: {
      opening: Number(side.metrics?.opening ?? 0),
      structure: Number(side.metrics?.structure ?? 0),
      framing: Number(side.metrics?.framing ?? 0),
      expression: Number(side.metrics?.expression ?? 0),
      tempo: Number(side.metrics?.tempo ?? 0),
      editing: Number(side.metrics?.editing ?? 0),
    },
    note: String(side.note ?? ""),
  });

  return {
    myVideo: toSide(parsed.myVideo ?? {}),
    referenceVideo: toSide(parsed.referenceVideo ?? {}),
    nextActions: Array.isArray(parsed.nextActions)
      ? parsed.nextActions.map((a: unknown) => String(a)).filter(Boolean)
      : [],
  };
}
