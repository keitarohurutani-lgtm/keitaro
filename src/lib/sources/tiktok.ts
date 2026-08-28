// TikTok公式APIアダプター（未接続・スタブ）
//
// TikTokは「今どんなハッシュタグ・音源が伸びているか」を外部開発者が自由に取得できる
// 公開トレンドAPIを提供していない。取得できるのは TikTok for Developers
// (https://developers.tiktok.com/) でアプリを申請し、審査を通過した上で連携した
// 自社TikTokアカウント自身の投稿データ（Content Posting API / Display API）のみ。
// トレンド発見用途に近い Research API は学術機関向けで、一般開発者は対象外。
//
// 手順（このリポジトリの外で行う必要があります）:
//   1. https://developers.tiktok.com/ で開発者登録・アプリ作成
//   2. 利用したいAPI（Display API等）のスコープを申請し、アプリ審査を待つ
//   3. 審査通過後に発行されるアクセストークンを .env.local の TIKTOK_API_KEY に設定
//   4. 下記 fetchTikTokTrends を実際のAPI呼び出しに置き換える
//
// 現時点ではキー未設定のため、呼び出すと分かりやすいエラーを投げるだけの実装です。

export interface TikTokTrendVideo {
  id: string;
  title: string;
  authorName: string;
  url: string;
}

export async function fetchTikTokTrends(query: string): Promise<TikTokTrendVideo[]> {
  void query; // 将来の実装で使用する検索クエリ（現在はスタブのため未使用）
  if (!process.env.TIKTOK_API_KEY) {
    throw new Error(
      "TikTok公式APIは未接続です。developers.tiktok.com でのアプリ審査完了後、" +
        "TIKTOK_API_KEY を設定し、このファイルの実装をTikTok API呼び出しに置き換えてください。"
    );
  }
  throw new Error("TikTok連携は未実装です（APIキー設定後、実装が必要です）。");
}

// ここから下は上記スタブとは別物。TikTokの公開oEmbed API（認証不要・審査不要）で、
// 個別動画の実データ（タイトル・投稿者名・埋め込み用HTML）だけを取得する機能。
// 動画のピクセル自体は取得できないため、AIによる画角・編集分析はできない
// （Gemini自体もTikTokの動画URLを直接処理できないことを確認済み）。
// POST CHECKで「動画を実際に表示はできるが、AI分析はYouTubeのみ」という用途で使う。

export interface TikTokOembed {
  title: string;
  authorName: string;
  authorUrl: string;
  embedHtml: string;
}

export function isTikTokUrl(url: string): boolean {
  try {
    return /(^|\.)tiktok\.com$/.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export async function fetchTikTokOembed(videoUrl: string): Promise<TikTokOembed | null> {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    title?: string;
    author_name?: string;
    author_url?: string;
    html?: string;
  };
  if (!json.html) return null;
  return {
    title: json.title ?? "",
    authorName: json.author_name ?? "",
    authorUrl: json.author_url ?? "",
    embedHtml: json.html,
  };
}
