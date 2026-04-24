# Cloudflare への公開（OpenNext）

本リポジトリは **OpenNext Cloudflare** で Workers 向けにビルドできます。独自ドメインは **`https://` の `NEXT_PUBLIC_SITE_URL`** を Cloudflare の環境変数に設定してください。

## 前提

- Node 20+ 推奨
- **Windows**: `npm run build:cf` は symlink 作成で `EPERM` になることがあります（OpenNext の既知の挙動）。対処は次のいずれかです。
  - **WSL2** 上の Linux ファイルシステムで同じリポジトリを clone して `build:cf` / `deploy:cf` を実行する
  - **GitHub Actions** 等の Linux CI で `build:cf` を実行し、成果物を Wrangler でデプロイする
  - Windows で「開発者向け: シンボリックリンクを有効にする」（要管理者）を試す

## 手順（概要）

1. Cloudflare アカウントでログインし、Wrangler を認証: `npx wrangler login`
2. 本番用 **Turso** データベースを作成し、`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` を用意する（開発用とは別インスタンス推奨）。
3. Cloudflare ダッシュボードで Worker（または Git 連携）の **Environment variables** に以下を設定:
   - `NEXT_PUBLIC_SITE_URL`（例: `https://あなたのドメイン`）
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - `OPENAI_API_KEY`（検閲・海の名言を使う場合）
   - `WAREHOUSE_PASSWORD`（運営用 `/warehouse` ログイン。長いランダム文字列推奨。未設定だと倉庫は使えません）
   - 初回デプロイ後、ローカルまたは CI で `npm run seed-quotes`（`.env.local` 相当の Turso 変数が必要）を実行し、`quotes` テーブルに 150 件の名言を投入してください。
4. ルートで `npm run build:cf` が成功することを確認。
5. `npm run deploy:cf` でデプロイ（または CI で同コマンド）。

## スクリプト

| コマンド        | 説明                               |
| --------------- | ---------------------------------- |
| `npm run build` | 通常の Next ビルド（Vercel 等）   |
| `npm run build:cf` | OpenNext の Cloudflare 用ビルド |
| `npm run preview:cf` | ビルド後にローカルで Workers 互換プレビュー |
| `npm run deploy:cf`  | ビルド後に Cloudflare へアップロード |

`wrangler.jsonc` の `name` はプロジェクトに合わせて変更してください（`services[].service` も同じ名前に）。

## 広告

本番では `AdSlot` は **見た目のないフック**（`data-ad-slot`）のみです。契約後に AdSense 等の `ins` を差し込む場合は `components/AdSlot.tsx` を拡張してください。
