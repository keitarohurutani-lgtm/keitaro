# ASOBI LAB（アソビラボ）

タレントスクール所属者向けのSNS活動支援Webサービス。「発見→企画→投稿→分析→改善」のサイクルを回すためのプラットフォーム。

## セットアップ

```bash
npm install
npm run seed   # 初期トレンドをDBに投入
npm run dev    # http://localhost:3000
```

### 環境変数（`.env.local`）

`.env.local.example` をコピーして使用してください。

| 変数 | 用途 | 必須 |
| --- | --- | --- |
| `DATABASE_URL` | Neon（サーバーレスPostgres）の接続文字列 | 必須。`sslmode=require`は必要だが`channel_binding=require`はPrisma CLIの`migrate`系コマンドが対応していないため付けない |
| `GEMINI_API_KEY` | IDEAページのAI企画生成（トレンド→企画） | 生成機能を使う場合は必須 |
| `YOUTUBE_API_KEY` | `npm run sync-trends` / Vercel Cronでの実トレンド取得 | 実データ連携を使う場合は必須 |
| `CRON_SECRET` | `/api/cron/sync-trends` をVercel Cron以外から叩けないようにする鍵 | 本番では推奨（Vercelが自動でAuthorizationヘッダーに付与） |
| `SESSION_SECRET` | ログインセッションCookieの署名鍵 | 本番では必須（未設定時は開発用の固定値にフォールバックし、誰でもセッションを偽造できてしまう） |

`GEMINI_API_KEY` / `YOUTUBE_API_KEY` が未設定でもアプリ自体は起動し、該当機能だけがエラーメッセージ付きで無効になります（DB永続化・保存済み企画の閲覧・POST CHECK/BENCHMARKのログ記録などは鍵なしで動作）。`SESSION_SECRET` は本番運用前に必ず設定してください（`openssl rand -hex 32` などで生成）。

## アカウント・データ分離

タレントごとにメール＋パスワードでアカウントを作成できます（`/register`）。企画（Idea）・アクティビティログ（Activity）はユーザーごとに分離され、他のタレントのデータは一切見えません（API側でも所有者チェックあり）。トレンド（Trend）はユーザーに紐付かない共有データとして全員に同じ内容が表示されます。

未ログイン状態でアクセスすると、`/login` と `/register`、`/api/auth/*`、`/api/health` 以外の全ページ・全APIが自動的に `/login` へリダイレクトされます（`src/proxy.ts`）。セッションは署名付きCookie（`SESSION_SECRET`によるHMAC）で管理しており、DBにセッションテーブルは持ちません。

## 実データ連携について

- **DB永続化**：企画（Idea）・トレンド（Trend）・週間ランキング（TrendRanking）・アクティビティログ（Activity）はNeon（サーバーレスPostgres）に永続化されます。MY REPORTの数値・週間アクティビティ・最近のアクティビティはすべて実際の操作履歴（ユーザーごと）から集計しています。
- **トレンド実データ（YouTube）**：YouTube Data API から実際に再生数が伸びている動画を取得し、Geminiでカテゴリー分け・注目理由・使い方の解説文（音源カテゴリーの場合は歌手名・曲名も）を生成してTRENDページに反映します（`src/lib/trend-sync.ts`）。各トレンドカードには元動画への参考リンク（`sourceUrl`・チャンネル名）も表示され、「誰を参考にできるか」がすぐ分かるようになっています。伸び率(%)は算出できないため、実際の再生回数をそのまま表示しています。カテゴリーごとに再生数上位5件を週間ランキングとして保存し、TRENDページでカテゴリーを選ぶと閲覧できます。
  - **手動実行**：`npm run sync-trends`
  - **自動定期更新**：`GEMINI_API_KEY` と `YOUTUBE_API_KEY` の両方が設定されていれば、Vercel Cron（`vercel.json`、`/api/cron/sync-trends`）が1日1回自動実行します。Vercel Hobbyプランのcronは1日1回までという制限のため、この頻度になっています。
  - SEED（初期投入のダミーデータ）には歌手名・曲名・参考リンクを含めていません。これらは実際の根拠がない情報を捏造しないためで、実データ（YouTube）に切り替わって初めて表示されます。
- **TikTok / Instagram**：両プラットフォームとも、外部開発者が自由に「今のトレンド」を取得できる公開APIを提供していません。取得できるのは審査を通過したアプリでの自社アカウントデータのみです。そのため `src/lib/sources/tiktok.ts` / `src/lib/sources/instagram.ts` はアダプターの型・エラーメッセージのみを用意したスタブになっています。TikTok for Developers / Meta for Developers でアプリ審査が完了し次第、`TIKTOK_API_KEY` / `INSTAGRAM_ACCESS_TOKEN` を設定してこれらのファイルを実装してください。

## AI生成ロジック（トレンド→企画）

IDEAページの「AIに企画を提案してもらう」は `src/lib/ai.ts` の `generateIdeaFromTrend` が担当します。選んだトレンドとキャラクタータイプ（元気印/クール/ほんわか/毒舌気味/正統派）を渡すと、Gemini（`gemini-3.1-flash-lite`）が構造化JSONで企画タイトル・理由・POST PLAN（冒頭1秒・撮影場所・表情・構成・尺・オチ）を生成し、DBに保存します。断定口調ではなく提案口調で出力するようシステムプロンプトで指定しています。

## POST CHECK / BENCHMARK について

実際の映像フレームAI解析は行っていません（動画アップロード基盤・マルチモーダル解析が別途必要なため）。分析結果は一貫したサンプル内容を返しますが、実行したこと自体はActivityとしてDBに記録され、MY REPORTの実数値に反映されます。画面には常に「AIによる参考分析です」という注意書きを表示しています。

## デプロイ（Vercel + Neon、完全無料・永続）

DBはNeon（サーバーレスPostgres、無料枠が永続的でカード登録不要）、ホスティングはVercel Hobbyプラン（無料・カード登録不要）を使います。どちらもトライアルではなく恒久的な無料枠です。

### 1. Neonプロジェクトを作成

[neon.tech](https://neon.tech) でプロジェクトを作成し、Connection stringを控える。**Prisma CLIの`migrate`系コマンドは`channel_binding=require`パラメータに対応していない**ため、接続文字列からこのパラメータは外し、`sslmode=require`のみを残すこと（例: `postgresql://user:pass@host/db?sslmode=require`）。

### 2. Vercelにリポジトリをインポート

VercelのダッシュボードでGitHubリポジトリをインポートするだけで、Next.jsプロジェクトとして自動検出されます。特別な設定は不要です。

### 3. 環境変数を設定（Vercelのプロジェクト設定）

| 変数 | 値 | 備考 |
| --- | --- | --- |
| `DATABASE_URL` | 手順1のConnection string | 必須 |
| `SESSION_SECRET` | `openssl rand -hex 32`等で生成した値 | 必須（ログイン機能のセキュリティ上必須） |
| `CRON_SECRET` | `openssl rand -hex 32`等で生成した値 | `/api/cron/sync-trends` を保護する鍵。Vercelが自動でリクエストに付与する |
| `GEMINI_API_KEY` | 取得したキー | IDEA生成・トレンド定期更新を使う場合 |
| `YOUTUBE_API_KEY` | 取得したキー | トレンド同期・定期更新を使う場合 |

### 4. デプロイ

Push するとVercelがビルド（`next build`）し、自動でデプロイされます。

**マイグレーションは自動実行しません**（ビルドに組み込むと、Neonの無料枠がアイドルでスリープしている瞬間にビルドが走った場合、DBが起きるまでの数秒間で接続タイムアウトし、ビルド自体が失敗する`P1002`エラーに遭遇したため）。スキーマを変更した場合は、ローカルから本番のNeon DBに向けて手動で1回 `npm run migrate:deploy` を実行してください。初回のトレンドデータ投入も同様に、本番の`DATABASE_URL`を設定した状態で `npm run seed` を手動実行します。

トレンドの自動更新は `vercel.json` で定義したVercel Cron（1日1回）が `/api/cron/sync-trends` を叩く形で行われます。Vercel Hobbyプランのcronは1日1回までという制限があるため、この頻度になっています。ヘルスチェックには `GET /api/health`（DBに疎通できれば `{"status":"ok"}`）を使えます。

## 主なディレクトリ

```
prisma/schema.prisma       DBスキーマ（User / Trend / TrendRanking / Idea / Activity）
prisma/seed.ts              初期トレンド・週間ランキングのシード
scripts/sync-trends.ts      YouTube実データ同期スクリプト（手動CLI）
vercel.json                  Vercel Cronの設定（トレンド定期同期を1日1回実行）
src/app/api/cron/sync-trends/  Vercel Cronから呼ばれるトレンド定期同期エンドポイント
src/proxy.ts                 未ログインアクセスを/loginへリダイレクトするガード
src/lib/prisma.ts             Neon（サーバーレスPostgres）へのPrisma接続
src/lib/week.ts                週間ランキングの週区切り計算
src/lib/ai.ts                 Gemini連携（企画生成・トレンド要約・音源情報抽出）
src/lib/trend-sync.ts         トレンド同期の共通ロジック（CLI・Cronの両方から呼ばれる）
src/lib/sources/              外部データソースのアダプター（youtube / tiktok / instagram）
src/lib/auth.ts / session.ts / password.ts   認証基盤（セッションCookie・パスワードハッシュ）
src/app/login/, src/app/register/   ログイン・新規登録ページ
src/app/api/auth/             ログイン・登録・ログアウトのAPI Routes
src/app/api/                  生成・保存トグル・アクティビティ記録のAPI Routes
src/app/api/health/           ヘルスチェック用エンドポイント
src/app/{page,trend,idea,analyze,report}/  各ページ
```
