# Vercelデプロイ後の設定手順（詳細版）

## 前提条件

✅ Vercelに環境変数 `DATABASE_URL` は設定済み（完了済み）

## 手順2: Prismaマイグレーションの実行

### 方法A: ローカルのターミナルで実行（推奨・簡単）

#### ステップ1: .envファイルの確認

現在のプロジェクトフォルダ（`c:\Users\ozroo\wedding-marketplace`）にある`.env`ファイルに、Supabaseの`DATABASE_URL`が正しく設定されているか確認してください。

`.env`ファイルの内容例：
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
```

**重要**: `[YOUR-PASSWORD]`の部分は、Supabaseのデータベースパスワードに置き換えてください。

#### ステップ2: ターミナルで実行

現在開いている**PowerShellターミナル**（またはこのプロジェクトフォルダで開いたターミナル）で、以下のコマンドを実行：

```powershell
# 1. 現在のディレクトリを確認（プロジェクトルートにいることを確認）
cd c:\Users\ozroo\wedding-marketplace

# 2. Prismaクライアントを生成（念のため）
npx prisma generate

# 3. マイグレーションを実行（Supabaseにテーブルを作成）
npx prisma migrate deploy
```

**実行結果の確認**:
- `✅ Applied migration: 20260106114428_init` などのメッセージが表示されれば成功
- エラーが出た場合は、`.env`ファイルの`DATABASE_URL`を確認

#### ステップ3: 初期データの投入（シード）

```powershell
# カテゴリマスタと管理者アカウントを作成
npm run db:seed
```

**実行結果の確認**:
- `✅ カテゴリマスタを作成しました` と表示されれば成功
- `✅ 管理者アカウントを作成しました (admin@example.com / admin123)` と表示されれば成功

### 方法B: Vercel CLIを使用する方法（上級者向け）

Vercel CLIを使用する場合：

```powershell
# Vercel CLIをインストール（初回のみ）
npm i -g vercel

# Vercelにログイン
vercel login

# プロジェクトをリンク
vercel link

# 環境変数をローカルに設定（Vercelから取得）
vercel env pull .env.local

# マイグレーション実行
npx prisma migrate deploy

# シード実行
npm run db:seed
```

### 方法C: Supabase Dashboardから直接実行（GUI派向け）

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左メニューから **SQL Editor** をクリック
4. **New query** をクリック
5. 以下のマイグレーションファイルを順番に開いて、その内容をコピー＆ペーストして実行：
   - `prisma/migrations/20260106114428_init/migration.sql`
   - `prisma/migrations/20260107020226_add_multiple_vendor_profiles/migration.sql`
   - `prisma/migrations/20260107030000_add_vendor_images/migration.sql`
   - `prisma/migrations/20260107172022_add_profile_images/migration.sql`
   - `prisma/migrations/20260107180223_add_profile_categories_and_plans/migration.sql`

6. 各ファイルを **Run** ボタンで実行

## 手順3: 動作確認

### マイグレーションが成功したか確認

1. Supabase Dashboard → **Database** → **Tables** を開く
2. 以下のテーブルが作成されているか確認：
   - `categories`
   - `couples`
   - `vendors`
   - `vendor_profiles`
   - `plan_boards`
   - など

### シードが成功したか確認

1. Supabase Dashboard → **Database** → **Table Editor** を開く
2. `categories` テーブルを選択
3. カテゴリデータ（会場、写真、ケータリングなど）が表示されるか確認
4. `admins` テーブルを選択
5. `admin@example.com` の管理者アカウントが作成されているか確認

## 手順4: Vercelで再デプロイ

マイグレーションとシードが完了したら：

1. Vercel Dashboardにアクセス
2. プロジェクトを選択
3. **Deployments** タブを開く
4. 最新のデプロイメントの右側にある **...** メニューをクリック
5. **Redeploy** を選択

または、何か変更を加えてGitHubにプッシュすれば自動デプロイされます。

## トラブルシューティング

### エラー: `P1001: Can't reach database server`

**原因**: `.env`ファイルの`DATABASE_URL`が正しく設定されていない、またはネットワークに接続できていない

**解決方法**:
1. `.env`ファイルの`DATABASE_URL`を確認
2. Supabase Dashboard → Project Settings → Database → Connection string で接続文字列を確認
3. パスワードが正しく含まれているか確認

### エラー: `P3005: Database schema is not empty`

**原因**: 既にテーブルが存在している

**解決方法**:
- 初回セットアップの場合: エラーを無視して続行
- データをリセットしたい場合: Supabase Dashboard → Database → Reset database（注意：全データが削除されます）

### エラー: `prisma: command not found`

**原因**: `node_modules`がインストールされていない

**解決方法**:
```powershell
npm install
```

## よくある質問

### Q: ローカルで実行したデータがVercelでも使えるの？

**A**: はい。ローカルで実行したマイグレーションとシードは、**Supabaseのデータベース**に直接書き込まれます。Vercelも同じSupabaseデータベースに接続するので、同じデータが使えます。

### Q: 既にデータがある場合はどうすればいい？

**A**: `prisma migrate deploy`は既存のテーブルを確認して、新しいマイグレーションのみを適用します。既存データは削除されません。

### Q: シードを複数回実行しても大丈夫？

**A**: はい。シードスクリプトは`upsert`を使用しているので、既存データを更新せず、存在しない場合のみ作成します。複数回実行しても問題ありません。
