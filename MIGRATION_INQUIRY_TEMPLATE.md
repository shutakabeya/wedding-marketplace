# inquiry_template_message フィールド追加のマイグレーション手順

## 現在の状況
- ✅ ローカル環境：ポート5432（通常接続）で既に適用済み（`prisma db push`実行済み）
- ⚠️ 本番環境（Vercel）：ポート6543（接続プーリング）で未適用
- ✅ マイグレーションファイル作成済み：`prisma/migrations/20250110_add_inquiry_template_message/migration.sql`

## 手順：方法Aを使用して本番環境に適用

### ステップ1: Vercel Dashboardで本番環境の接続文字列を確認

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクトを選択
3. **Settings** → **Environment Variables** をクリック
4. `DATABASE_URL` の値を確認（表示ボタンをクリック）

本番環境の接続文字列は以下のような形式になっているはずです：

```
postgresql://postgres.rivfzymqtbagbjqjyget:052899skRvsun55@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### ステップ2: 接続プーリングの接続文字列を通常接続に変換

`prisma migrate deploy`は接続プーリング（`?pgbouncer=true`）をサポートしていないため、通常の接続（ポート5432）に変換する必要があります。

変換方法：
- ユーザー名: `postgres.rivfzymqtbagbjqjyget` → `postgres`（プロジェクト参照を削除）
- ホスト名: `aws-0-ap-south-1.pooler.supabase.com` → `db.rivfzymqtbagbjqjyget.supabase.co`（通常の形式に変更）
- ポート: `6543` → `5432`（通常のPostgreSQLポートに変更）
- パラメータ: `?pgbouncer=true` → 削除

**変換例**：

変換前（Vercel環境変数 - 接続プーリング）：
```
postgresql://postgres.rivfzymqtbagbjqjyget:052899skRvsun55@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

変換後（通常接続）：
```
postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres
```

### ステップ3: ローカルの`.env`ファイルを一時的に変更

1. `.env`ファイルを開く
2. 現在の`DATABASE_URL`をコメントアウト
3. 変換した本番環境の接続文字列（通常接続、5432）を一時的に設定

**例**：

変更前（ローカル用）：
```env
DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
```

変更後（一時的に本番環境用に変更）：
```env
# ローカル用（一時的にコメントアウト）
# DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"

# 本番環境用（一時的に有効化）- 変換した通常接続文字列を使用
DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
```

**重要**：
- パスワードはVercel Dashboardで確認した値を使用してください
- ホスト名が異なる場合は、本番環境の実際のホスト名を使用してください
- プロジェクト参照（`rivfzymqtbagbjqjyget`）は実際のSupabaseプロジェクト参照に置き換えてください

### ステップ4: マイグレーションを適用

PowerShellまたはコマンドプロンプトで、以下のコマンドを実行します：

```powershell
npx prisma migrate deploy
```

**実行例**：

```powershell
PS C:\Users\ozroo\wedding-marketplace> npx prisma migrate deploy

Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.rivfzymqtbagbjqjyget.supabase.co:5432"

Applying migration `20250110_add_inquiry_template_message`

The following migration(s) have been applied:

migrations/
  └─ 20250110_add_inquiry_template_message/
    └─ migration.sql

All migrations have been successfully applied.
```

**成功時のメッセージ**：
- `All migrations have been successfully applied.` と表示されれば成功です。

**エラーが発生した場合**：
- 接続エラー: `.env`の接続文字列を確認（パスワード、ホスト名、ポート番号）
- 権限エラー: Supabaseのパスワードを確認
- テーブルが既に存在する: 既に適用済みの可能性があります（`prisma db push`で適用済みの場合）

### ステップ5: `.env`ファイルをローカル用に戻す

マイグレーション適用後、必ず`.env`ファイルをローカル環境用に戻してください。

```env
# ローカル用（有効化）
DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"

# 本番環境用（コメントアウト）
# DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
```

**なぜ元に戻す必要があるのか**：
- ローカル開発時に誤って本番環境のデータベースに接続してしまうのを防ぐため
- ローカル環境と本番環境を明確に分離するため
- ただし、この場合、ローカルと本番が同じデータベースインスタンスを指している場合は、そのままでも問題ありません

### ステップ6: 動作確認（オプション）

マイグレーションが正しく適用されたか確認するには：

```powershell
# Prisma Studioでデータベースを確認（オプション）
npx prisma studio
```

または、Supabase Dashboardの**Table Editor**で`vendor_profiles`テーブルの`inquiry_template_message`カラムが追加されているか確認できます。

## まとめ

1. ✅ Vercel Dashboardで本番環境の接続文字列（6543、接続プーリング）を確認
2. ✅ 接続プーリングの接続文字列を通常接続（5432）に変換
3. ✅ ローカルの`.env`を一時的に変換した本番環境の接続文字列に変更
4. ✅ `npx prisma migrate deploy`を実行
5. ✅ `.env`をローカル用に戻す

これで、本番環境（Supabase）に`inquiry_template_message`フィールドが追加され、ベンダーがプロフィールごとにお問い合わせテンプレートメッセージを設定できるようになります。
