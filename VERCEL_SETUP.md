# Vercelデプロイ設定ガイド

## 問題の原因

500エラーが発生している主な原因：
1. **環境変数 `DATABASE_URL` がVercelに設定されていない**
2. **PrismaマイグレーションがVercelで実行されていない**

## 解決手順

### 1. Vercelに環境変数を設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. 以下の環境変数を追加：

   ```
   DATABASE_URL = postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

   **重要**: Supabaseの接続文字列は以下から取得できます：
   - Supabase Dashboard → Project Settings → Database → Connection string
   - 「URI」タブを選択し、パスワードを入力した後の接続文字列をコピー

### 2. Prismaマイグレーションを実行

Vercelではビルド時に自動的にマイグレーションを実行できません。以下のいずれかの方法で実行してください：

#### 方法A: Vercel CLIから実行（推奨）

ローカルでVercel CLIを使用してマイグレーションを実行：

```bash
# Vercel CLIをインストール（未インストールの場合）
npm i -g vercel

# 環境変数を設定（.env.localまたはローカル環境変数）
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# マイグレーションを実行
npx prisma migrate deploy
```

#### 方法B: Supabase DashboardのSQL Editorから実行

1. Supabase Dashboard → SQL Editor に移動
2. `prisma/migrations` フォルダ内のすべてのマイグレーションファイル（`.sql`）を順番に実行

マイグレーションファイルの場所：
- `prisma/migrations/20260106114428_init/migration.sql`
- `prisma/migrations/20260107020226_add_multiple_vendor_profiles/migration.sql`
- `prisma/migrations/20260107030000_add_vendor_images/migration.sql`

### 3. 初期データの投入（オプション）

マイグレーション後、カテゴリマスタや管理者アカウントなどの初期データを投入：

```bash
# 環境変数を設定
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# シードを実行
npm run db:seed
```

または、Supabase DashboardのSQL Editorから直接実行することもできます。

### 4. Vercelで再デプロイ

1. Vercel Dashboardでプロジェクトを選択
2. **Deployments** タブを開く
3. 最新のデプロイメントの「...」メニューから **Redeploy** を選択
4. または、GitHubに新しいコミットをプッシュして自動デプロイ

## 接続プーリングの使用（推奨）

Supabaseでは接続プーリングを使用することを推奨します。環境変数を以下の形式に変更：

```
DATABASE_URL = postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

接続プーリングのURLは、Supabase Dashboard → Project Settings → Database → Connection string の「Connection pooling」タブから取得できます。

## トラブルシューティング

### 500エラーが続く場合

1. **環境変数の確認**
   - Vercel Dashboardで環境変数が正しく設定されているか確認
   - 接続文字列にパスワードが正しく含まれているか確認

2. **マイグレーションの確認**
   - Supabase Dashboard → Database → Tables でテーブルが作成されているか確認
   - マイグレーションが全て実行されているか確認

3. **ログの確認**
   - Vercel Dashboard → Deployments → 最新のデプロイメント → Functions Logs でエラーを確認

### データが表示されない場合

- マイグレーション後にシードスクリプトを実行して初期データを投入してください
- または、Supabase Dashboardから直接データを追加してください
