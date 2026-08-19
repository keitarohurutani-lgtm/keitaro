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
| `GEMINI_API_KEY` | IDEAページのAI企画生成（トレンド→企画） | 生成機能を使う場合は必須 |
| `YOUTUBE_API_KEY` | `npm run sync-trends` / 定期自動更新での実トレンド取得 | 実データ連携を使う場合は必須 |
| `TREND_SYNC_INTERVAL_MINUTES` | トレンド定期自動更新の間隔（分） | 任意（既定360分＝6時間） |
| `SESSION_SECRET` | ログインセッションCookieの署名鍵 | 本番では必須（未設定時は開発用の固定値にフォールバックし、誰でもセッションを偽造できてしまう） |

`GEMINI_API_KEY` / `YOUTUBE_API_KEY` が未設定でもアプリ自体は起動し、該当機能だけがエラーメッセージ付きで無効になります（DB永続化・保存済み企画の閲覧・POST CHECK/BENCHMARKのログ記録などは鍵なしで動作）。`SESSION_SECRET` は本番運用前に必ず設定してください（`openssl rand -hex 32` などで生成）。

## アカウント・データ分離

タレントごとにメール＋パスワードでアカウントを作成できます（`/register`）。企画（Idea）・アクティビティログ（Activity）はユーザーごとに分離され、他のタレントのデータは一切見えません（API側でも所有者チェックあり）。トレンド（Trend）はユーザーに紐付かない共有データとして全員に同じ内容が表示されます。

未ログイン状態でアクセスすると、`/login` と `/register`、`/api/auth/*`、`/api/health` 以外の全ページ・全APIが自動的に `/login` へリダイレクトされます（`src/proxy.ts`）。セッションは署名付きCookie（`SESSION_SECRET`によるHMAC）で管理しており、DBにセッションテーブルは持ちません。

## 実データ連携について

- **DB永続化**：企画（Idea）・トレンド（Trend）・アクティビティログ（Activity）はSQLite（Prisma）に永続化されます。MY REPORTの数値・週間アクティビティ・最近のアクティビティはすべて実際の操作履歴（ユーザーごと）から集計しています。
- **トレンド実データ（YouTube）**：YouTube Data API から実際に再生数が伸びている動画を取得し、Geminiでカテゴリー分け・注目理由・使い方の解説文（音源カテゴリーの場合は歌手名・曲名も）を生成してTRENDページに反映します（`src/lib/trend-sync.ts`）。各トレンドカードには元動画への参考リンク（`sourceUrl`・チャンネル名）も表示され、「誰を参考にできるか」がすぐ分かるようになっています。伸び率(%)は算出できないため、実際の再生回数をそのまま表示しています。
  - **手動実行**：`npm run sync-trends`
  - **自動定期更新**：`GEMINI_API_KEY` と `YOUTUBE_API_KEY` の両方が設定されていれば、サーバー起動時に自動で有効化されます（`src/instrumentation.ts`）。起動時に1回実行され、以降は `TREND_SYNC_INTERVAL_MINUTES`（既定360分）ごとに自動実行されます。追加のCronサービス設定は不要です。
  - SEED（初期投入のダミーデータ）には歌手名・曲名・参考リンクを含めていません。これらは実際の根拠がない情報を捏造しないためで、実データ（YouTube）に切り替わって初めて表示されます。
- **TikTok / Instagram**：両プラットフォームとも、外部開発者が自由に「今のトレンド」を取得できる公開APIを提供していません。取得できるのは審査を通過したアプリでの自社アカウントデータのみです。そのため `src/lib/sources/tiktok.ts` / `src/lib/sources/instagram.ts` はアダプターの型・エラーメッセージのみを用意したスタブになっています。TikTok for Developers / Meta for Developers でアプリ審査が完了し次第、`TIKTOK_API_KEY` / `INSTAGRAM_ACCESS_TOKEN` を設定してこれらのファイルを実装してください。

## AI生成ロジック（トレンド→企画）

IDEAページの「AIに企画を提案してもらう」は `src/lib/ai.ts` の `generateIdeaFromTrend` が担当します。選んだトレンドとキャラクタータイプ（元気印/クール/ほんわか/毒舌気味/正統派）を渡すと、Gemini（`gemini-3.1-flash-lite`）が構造化JSONで企画タイトル・理由・POST PLAN（冒頭1秒・撮影場所・表情・構成・尺・オチ）を生成し、DBに保存します。断定口調ではなく提案口調で出力するようシステムプロンプトで指定しています。

## POST CHECK / BENCHMARK について

実際の映像フレームAI解析は行っていません（動画アップロード基盤・マルチモーダル解析が別途必要なため）。分析結果は一貫したサンプル内容を返しますが、実行したこと自体はActivityとしてDBに記録され、MY REPORTの実数値に反映されます。画面には常に「AIによる参考分析です」という注意書きを表示しています。

## デプロイ（Railway / 永続ディスク対応ホスト向け）

DBが `better-sqlite3` によるローカルファイル永続化のため、**Vercelなどのサーバーレス環境には非対応**です（リクエストごとにファイルシステムがリセットされ、保存した企画やアクティビティ履歴が消えます）。Railway・Fly.io・Renderなど、永続ボリュームをアタッチできるホストを使ってください。以下はRailwayを例にした手順です。

### 1. リポジトリをRailwayに接続

Railwayが `Dockerfile` を自動検出してビルドします（Nixpacksは使いません）。

### 2. ボリュームを作成してマウント

Railwayのダッシュボードで、このサービスに永続ボリュームを作成し、マウントパスを `/data` に設定してください。

### 3. 環境変数を設定

| 変数 | 値 | 備考 |
| --- | --- | --- |
| `DATABASE_URL` | `file:/data/dev.db` | 手順2のボリュームのマウントパスに合わせる |
| `SESSION_SECRET` | `openssl rand -hex 32`等で生成した値 | 必須（ログイン機能のセキュリティ上必須） |
| `GEMINI_API_KEY` | 取得したキー | IDEA生成・トレンド定期更新を使う場合 |
| `YOUTUBE_API_KEY` | 取得したキー | トレンド同期・定期更新を使う場合 |
| `NODE_ENV` | `production` | Dockerfile内で設定済みだが明示しても可 |

### 4. デプロイ

Push すると Railway が `Dockerfile` からビルドし、コンテナ起動時に `docker-entrypoint.sh` が

1. `prisma migrate deploy`（マイグレーション適用）
2. `npm run seed`（初回のみトレンドを投入、2回目以降は自動スキップ）
3. `npm start`（`next start` でサーバー起動）

を順に実行します。ヘルスチェックには `GET /api/health`（DBに疎通できれば `{"status":"ok"}`）を使えます。

### ローカルでのDocker動作確認について

この環境にはDockerが入っておらず、Dockerfileのビルド自体はローカルで検証できていません。デプロイ前に、Dockerが使える環境で一度 `docker build -t asobi-lab .` を実行して確認することをおすすめします。

## 主なディレクトリ

```
prisma/schema.prisma       DBスキーマ（User / Trend / Idea / Activity）
prisma/seed.ts              初期トレンドのシード
scripts/sync-trends.ts      YouTube実データ同期スクリプト（手動CLI）
src/instrumentation.ts       トレンド定期自動更新の起動フック
src/proxy.ts                 未ログインアクセスを/loginへリダイレクトするガード
src/lib/ai.ts                 Gemini連携（企画生成・トレンド要約）
src/lib/trend-sync.ts         トレンド同期の共通ロジック（CLI・定期更新の両方から呼ばれる）
src/lib/sources/              外部データソースのアダプター（youtube / tiktok / instagram）
src/lib/auth.ts / session.ts / password.ts   認証基盤（セッションCookie・パスワードハッシュ）
src/app/login/, src/app/register/   ログイン・新規登録ページ
src/app/api/auth/             ログイン・登録・ログアウトのAPI Routes
src/app/api/                  生成・保存トグル・アクティビティ記録のAPI Routes
src/app/api/health/           ヘルスチェック用エンドポイント
src/app/{page,trend,idea,analyze,report}/  各ページ
Dockerfile                    本番デプロイ用（Railway等、永続ディスク対応ホスト向け）
docker-entrypoint.sh          コンテナ起動時のmigrate/seed/start
```
