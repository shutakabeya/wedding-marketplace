np# Vercelデプロイ後のSupabaseマイグレーション手順

## 概要

Vercelにデプロイした後、Prismaスキーマの変更をSupabaseに反映する方法を説明します。

## 基本的なワークフロー

### 1. ローカルでスキーマを変更

```powershell
# prisma/schema.prisma を編集
# 例: 新しいフィールドを追加、テーブルを追加など
```

### 2. マイグレーションファイルを作成

```powershell
# マイグレーションファイルを作成（ローカルのSupabaseに適用される）
npx prisma migrate dev --name マイグレーション名

# 例:
# npx prisma migrate dev --name add_new_field
```

このコマンドで：
- マイグレーションファイル（`prisma/migrations/YYYYMMDDHHMMSS_マイグレーション名/migration.sql`）が作成される
- ローカルのSupabaseに自動的に適用される

### 3. マイグレーションファイルをGitにコミット・プッシュ

```powershell
# マイグレーションファイルをステージング
git add prisma/migrations/

# コミット
git commit -m "Add migration: マイグレーション名"

# プッシュ
git push origin master
```

### 4. 本番環境（Vercelで使用しているSupabase）にマイグレーションを適用

**重要**: Vercelのビルドプロセスでは自動的にマイグレーションが実行されません。手動で実行する必要があります。

#### 方法A: ローカルから本番環境に適用（推奨・簡単）

1. **`.env`ファイルを一時的に本番環境の接続文字列に変更**

   ```env
   # ローカル用（通常の接続）
   # DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
   
   # 本番環境用（一時的に切り替え）
   DATABASE_URL="postgresql://postgres.rivfzymqtbagbjqjyget:052899skRvsun55@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

   **注意**: 接続プーリング（`?pgbouncer=true`）を使用する場合、`prisma migrate deploy`は通常の接続（ポート5432）を使用する必要があります。そのため、一時的に通常の接続文字列を使用してください：

   ```env
   DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
   ```

2. **マイグレーションを適用**

   ```powershell
   # 本番環境にマイグレーションを適用
   npx prisma migrate deploy
   ```

3. **`.env`ファイルを元に戻す**

   ```env
   # ローカル用に戻す
   DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
   ```

#### 方法B: Supabase DashboardのSQL Editorから実行（GUI派向け）

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左メニューから **SQL Editor** をクリック
4. **New query** をクリック
5. 最新のマイグレーションファイルを開く：
   - `prisma/migrations/最新のマイグレーション名/migration.sql`
6. 内容をコピー＆ペースト
7. **Run** ボタンをクリック

#### 方法C: Vercel CLIを使用（上級者向け）

```powershell
# Vercel CLIをインストール（未インストールの場合）
npm i -g vercel

# Vercelにログイン
vercel login

# プロジェクトをリンク
vercel link

# 環境変数をローカルに取得
vercel env pull .env.local

# マイグレーション実行（.env.localのDATABASE_URLを使用）
npx prisma migrate deploy
```

## よくある質問

### Q: Vercelのビルド時に自動的にマイグレーションを実行できますか？

A: 可能ですが、推奨されません。理由：
- ビルド時間が長くなる
- ビルドが失敗する可能性がある
- ロールバックが困難

ただし、自動実行したい場合は、`package.json`の`build`スクリプトを以下のように変更できます：

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Q: ローカルと本番環境で異なるSupabaseを使用していますか？

A: 通常は同じSupabaseプロジェクトを使用しますが、異なるプロジェクトを使用する場合：
- ローカル用: `.env`ファイルの`DATABASE_URL`
- 本番環境用: Vercel Dashboardの環境変数`DATABASE_URL`

### Q: マイグレーションを実行するタイミングは？

A: 以下のタイミングで実行してください：
1. 新しいマイグレーションファイルを作成した後
2. Gitにプッシュした後
3. Vercelにデプロイする前（またはデプロイ後すぐ）

### Q: マイグレーションを間違えて実行してしまった場合、どうすればいいですか？

A: 新しいマイグレーションを作成してロールバックするか、Supabase DashboardのSQL Editorから直接SQLを実行して修正してください。

## まとめ

**推奨されるワークフロー**：

1. ローカルでスキーマ変更 → `npx prisma migrate dev`
2. マイグレーションファイルをGitにコミット・プッシュ
3. ローカルの`.env`を一時的に本番環境の接続文字列に変更
4. `npx prisma migrate deploy`で本番環境に適用
5. `.env`を元に戻す

これで、ローカルと本番環境の両方で同じスキーマが維持されます。
