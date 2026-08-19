// Instagram公式APIアダプター（未接続・スタブ）
//
// Instagram Graph API は、外部の任意の投稿を横断して「今伸びているハッシュタグ/リール」を
// 探す用途には使えない。取得できるのは、Instagramプロアカウント（ビジネス/クリエイター）を
// Facebookページに連携し、Meta for Developersでアプリ審査（instagram_basic等の権限）を
// 通過した上での、連携済み自社アカウント自身の投稿データのみ。
//
// 手順（このリポジトリの外で行う必要があります）:
//   1. Instagramアカウントをプロアカウント（ビジネス/クリエイター）に切り替え、Facebookページと連携
//   2. https://developers.facebook.com/ でアプリを作成
//   3. Instagram Graph APIの利用に必要な権限をアプリ審査に申請（数日〜数週間）
//   4. 審査通過後に発行されるアクセストークンを .env.local の INSTAGRAM_ACCESS_TOKEN に設定
//   5. 下記 fetchInstagramTrends を実際のGraph API呼び出しに置き換える
//
// 現時点ではキー未設定のため、呼び出すと分かりやすいエラーを投げるだけの実装です。

export interface InstagramTrendPost {
  id: string;
  caption: string;
  permalink: string;
}

export async function fetchInstagramTrends(query: string): Promise<InstagramTrendPost[]> {
  void query; // 将来の実装で使用する検索クエリ（現在はスタブのため未使用）
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
    throw new Error(
      "Instagram公式APIは未接続です。Meta for Developersでのアプリ審査完了後、" +
        "INSTAGRAM_ACCESS_TOKEN を設定し、このファイルの実装をGraph API呼び出しに置き換えてください。"
    );
  }
  throw new Error("Instagram連携は未実装です（アクセストークン設定後、実装が必要です）。");
}
