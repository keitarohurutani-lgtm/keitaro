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
| `YOUTUBE_API_KEY` | `npm run sync-trends` / `npm run sync-songs` / Vercel Cronでの実トレンド・音源ランキング取得 | 実データ連携を使う場合は必須 |
| `CRON_SECRET` | `/api/cron/sync-trends` `/api/cron/sync-songs` をVercel Cron以外から叩けないようにする鍵 | 本番では推奨（Vercelが自動でAuthorizationヘッダーに付与） |
| `SESSION_SECRET` | ログインセッションCookieの署名鍵 | 本番では必須（未設定時は開発用の固定値にフォールバックし、誰でもセッションを偽造できてしまう） |

`GEMINI_API_KEY` / `YOUTUBE_API_KEY` が未設定でもアプリ自体は起動し、該当機能だけがエラーメッセージ付きで無効になります（DB永続化・保存済み企画の閲覧などは鍵なしで動作）。`SESSION_SECRET` は本番運用前に必ず設定してください（`openssl rand -hex 32` などで生成）。

## アカウント・データ分離

タレントごとにメール＋パスワードでアカウントを作成できます（`/register`）。企画（Idea）・アクティビティログ（Activity）はユーザーごとに分離され、他のタレントのデータは一切見えません（API側でも所有者チェックあり）。トレンド（Trend）はユーザーに紐付かない共有データとして全員に同じ内容が表示されます。

未ログイン状態でアクセスすると、`/login` と `/register`、`/api/auth/*`、`/api/health` 以外の全ページ・全APIが自動的に `/login` へリダイレクトされます（`src/proxy.ts`）。セッションは署名付きCookie（`SESSION_SECRET`によるHMAC）で管理しており、DBにセッションテーブルは持ちません。

### 管理画面（/admin）

`ADMIN_EMAILS`環境変数に登録したメールアドレスのアカウントのみ、`/admin`から会員一覧・各会員の保存済み企画・活動履歴を閲覧できます（MY REPORT画面に「管理画面 →」リンクが表示される）。DBにフラグを持たないため、管理者を増減したいときは環境変数を編集するだけでよく、対象アカウントの再ログインも不要です。運営スタッフ間で共有する管理専用アカウントを1つ作り、そのメールアドレスを`ADMIN_EMAILS`に登録する運用を想定しています。

管理者は会員一覧・会員詳細ページの「削除」から、受講期間が終了した会員のアカウントを削除できます（`DELETE /api/admin/users/[id]`）。削除するとログインできなくなり、保存済み企画・活動履歴もあわせて削除されます（不可逆操作のため、対象のメールアドレスを入力しないと実行できないようになっています）。自分自身のアカウントはこの画面からは削除できません。

## 実データ連携について

- **DB永続化**：企画（Idea）・トレンド（Trend）・週間ランキング（TrendRanking）・アクティビティログ（Activity）はNeon（サーバーレスPostgres）に永続化されます。MY REPORTの数値・週間アクティビティ・最近のアクティビティはすべて実際の操作履歴（ユーザーごと）から集計しています。
- **トレンド実データ（YouTube）**：YouTube Data API から実際に再生数が伸びている動画を取得し、Geminiでカテゴリー分け・注目理由・使い方の解説文・検索キーワード・ハッシュタグ案を生成してTRENDページに反映します（`src/lib/trend-sync.ts`）。カテゴリー代表の動画は、Geminiが実際にその動画を見て画角・カット割り・編集のポイントも分析します（`analyzeVideoFromUrl`）。各トレンドカードには元動画への参考リンク（`sourceUrl`・チャンネル名）も表示され、「誰を参考にできるか」がすぐ分かるようになっています。伸び率(%)は算出できないため、実際の再生回数をそのまま表示しています。カテゴリーごとに再生数上位5件を週間ランキングとして保存し、TRENDページでカテゴリーを選ぶと閲覧できます（対象カテゴリー：SNS／ファッション／メイク／企画／TikTok／Instagram。「音源」は下記の専用ランキングに分離しています）。
  - **手動実行**：`npm run sync-trends`
  - **自動定期更新**：`GEMINI_API_KEY` と `YOUTUBE_API_KEY` の両方が設定されていれば、Vercel Cron（`vercel.json`、`/api/cron/sync-trends`）が1日1回自動実行します。Vercel Hobbyプランのcronは1日1回までという制限のため、この頻度になっています。
  - SEED（初期投入のダミーデータ）には参考リンクを含めていません。これは実際の根拠がない情報を捏造しないためで、実データ（YouTube）に切り替わって初めて表示されます。
- **音源ランキング（YouTube・/songs）**：TRENDとは別枠の専用ページです。主な使用用途（踊ってみた／ネタ系／Vlog系／その他）ごとに専用の検索クエリでYouTube Data APIから候補動画を集め、Geminiで曲名・アーティスト名を読み取れる範囲でバッチ抽出し、用途ごとに週間TOP20（実際に特定できた件数まで、最大80曲）として保存します（`src/lib/song-sync.ts`）。用途ラベルは「その用途向けの検索で見つかった動画」という検索クエリの切り口そのものが根拠で、AIが曲の使われ方を推測しているわけではありません。曲名・アーティスト名を特定できなかった動画や、メドレー・まとめ系の動画はランキングに含めません。並び順は再生数ではなく、その同期で検索・分析した動画のうち同じ曲だと判定された件数（`usageCount`）の多い順です——TikTok本体の「使用数」を取得できる公開APIは提供されていないため、あくまで今回の検索範囲内での参考値である旨をUI上にも明記しています。各曲にはMV／音源のYouTubeリンクを表示します。ネタ系・Vlog系は動画タイトルに曲名が出てこないことが多く、20曲に届かないことがあります（実際に特定できた件数だけを表示し、架空の曲で埋めることはしません）。
  - `/songs`ページは同期がまだ今週分を終えていなくても空白にならないよう、DBに保存されている直近の週のランキングを表示し続けます（週替わり直後は「今週分は準備中のため、直近の更新分を表示しています」と案内が出ます）。
  - **手動実行**：`npm run sync-songs`
  - **自動定期更新**：`GEMINI_API_KEY` と `YOUTUBE_API_KEY` の両方が設定されていれば、Vercel Cron（`vercel.json`、`/api/cron/sync-songs`）が1日1回自動実行します（sync-trendsとは別の時刻に設定し、実行time-outを避けています）。
- **TikTok / Instagram**：両プラットフォームとも、外部開発者が自由に「今のトレンド」を取得できる公開APIを提供していません。取得できるのは審査を通過したアプリでの自社アカウントデータのみです。そのため `src/lib/sources/tiktok.ts` / `src/lib/sources/instagram.ts` はアダプターの型・エラーメッセージのみを用意したスタブになっています。TikTok for Developers / Meta for Developers でアプリ審査が完了し次第、`TIKTOK_API_KEY` / `INSTAGRAM_ACCESS_TOKEN` を設定してこれらのファイルを実装してください。

## AI生成ロジック（トレンド→企画）

IDEAページの「AIに企画を提案してもらう」は `src/lib/ai.ts` の `generateIdeaFromTrend` が担当します。選んだトレンドとキャラクタータイプ（元気印/クール/ほんわか/毒舌気味/正統派）を渡すと、Gemini（`gemini-3.1-flash-lite`）が構造化JSONで企画タイトル・理由・POST PLAN（冒頭1秒・撮影場所・表情・構成・尺・オチ）を生成し、DBに保存します。断定口調ではなく提案口調で出力するようシステムプロンプトで指定しています。

## POST CHECK について

動画ファイルのアップロードではなく、**リンクを貼るリンク提出型**です。

- **YouTube**：Geminiの動画理解機能（`fileData.fileUri`にYouTube URLを渡す）で実際にその動画を最初から最後まで読み込み、場面ごとの画角・カット割り・編集（テロップ・BGM・トランジション等）を実際に観測した内容として分析します（`src/lib/ai.ts` の `analyzeVideoFromUrl`）。
- **TikTok**：公式oEmbed API（認証不要）で実際の動画を埋め込み表示できますが、GeminiがTikTokの動画URLを直接処理できない（400 INVALID_ARGUMENTになることを確認済み）ため、AIによる画角・編集分析は行いません。
- **Instagram**：埋め込み用APIも認証必須（アプリ審査が必要）のため非対応です。

実行したこと自体はActivityとしてDBに記録され、MY REPORTの実数値に反映されます。画面には常に「AIによる参考分析です」という注意書きを表示しています。

（旧BENCHMARK機能・2本の動画を比較する機能は削除しました。）

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
| `CRON_SECRET` | `openssl rand -hex 32`等で生成した値 | `/api/cron/sync-trends` `/api/cron/sync-songs` を保護する鍵。Vercelが自動でリクエストに付与する |
| `GEMINI_API_KEY` | 取得したキー | IDEA生成・トレンド定期更新を使う場合 |
| `YOUTUBE_API_KEY` | 取得したキー | トレンド同期・定期更新を使う場合 |

### 4. デプロイ

Push するとVercelがビルド（`next build`）し、自動でデプロイされます。

**マイグレーションは自動実行しません**（ビルドに組み込むと、Neonの無料枠がアイドルでスリープしている瞬間にビルドが走った場合、DBが起きるまでの数秒間で接続タイムアウトし、ビルド自体が失敗する`P1002`エラーに遭遇したため）。スキーマを変更した場合は、ローカルから本番のNeon DBに向けて手動で1回 `npm run migrate:deploy` を実行してください。初回のトレンドデータ投入も同様に、本番の`DATABASE_URL`を設定した状態で `npm run seed` を手動実行します。

トレンドの自動更新は `vercel.json` で定義したVercel Cron（1日1回、`/api/cron/sync-trends`）、音源ランキングの自動更新も同様に別枠のCron（1日1回、`/api/cron/sync-songs`）が行います。Vercel Hobbyプランはcronを2件まで・1日1回までという制限があるため、この2本構成に収めています。ヘルスチェックには `GET /api/health`（DBに疎通できれば `{"status":"ok"}`）を使えます。

## 主なディレクトリ

```
prisma/schema.prisma       DBスキーマ（User / Trend / TrendRanking / SongRanking / Idea / Activity）
prisma/seed.ts              初期トレンド・週間ランキングのシード
scripts/sync-trends.ts      YouTube実データ同期スクリプト（手動CLI）
scripts/sync-songs.ts       音源週間ランキング同期スクリプト（手動CLI）
vercel.json                  Vercel Cronの設定（トレンド・音源ランキングの定期同期を1日1回ずつ実行）
src/app/api/cron/sync-trends/  Vercel Cronから呼ばれるトレンド定期同期エンドポイント
src/app/api/cron/sync-songs/   Vercel Cronから呼ばれる音源ランキング定期同期エンドポイント
src/proxy.ts                 未ログインアクセスを/loginへリダイレクトするガード
src/lib/prisma.ts             Neon（サーバーレスPostgres）へのPrisma接続
src/lib/week.ts                週間ランキングの週区切り計算
src/lib/ai.ts                 Gemini連携（企画生成・トレンド要約・音源情報抽出）
src/lib/trend-sync.ts         トレンド同期の共通ロジック（CLI・Cronの両方から呼ばれる）
src/lib/song-sync.ts          音源週間ランキング同期の共通ロジック（CLI・Cronの両方から呼ばれる）
src/lib/sources/              外部データソースのアダプター（youtube / tiktok / instagram）
src/lib/auth.ts / session.ts / password.ts   認証基盤（セッションCookie・パスワードハッシュ）
src/app/login/, src/app/register/   ログイン・新規登録ページ
src/app/api/auth/             ログイン・登録・ログアウトのAPI Routes
src/app/api/                  生成・保存トグル・アクティビティ記録のAPI Routes
src/app/api/health/           ヘルスチェック用エンドポイント
src/app/{page,trend,songs,playbook,idea,analyze,report}/  各ページ
```
