# 方法A: `prisma migrate deploy` の詳しい解説

## 概要

方法Aは、ローカルのコマンドラインから`prisma migrate deploy`コマンドを使って、本番環境（Vercelで使用しているSupabase）にマイグレーションを適用する方法です。

## なぜこの方法が推奨されるのか

1. **マイグレーション履歴の自動管理**: Prismaが`_prisma_migrations`テーブルに適用済みマイグレーションを記録
2. **未適用マイグレーションの自動検出**: 次回実行時に、未適用のマイグレーションだけを自動で適用
3. **複数マイグレーションの一括適用**: 複数のマイグレーションファイルがある場合、一度にすべて適用
4. **チーム開発での一貫性**: 全員が同じコマンドで同じ結果を得られる

## 前提条件

- マイグレーションファイルが`prisma/migrations/`ディレクトリに存在すること
- 本番環境のSupabase接続情報（パスワードなど）が分かっていること
- Vercel Dashboardで設定されている`DATABASE_URL`を確認できること

## ステップバイステップの手順

### ステップ1: 現在の`.env`ファイルを確認

まず、現在の`.env`ファイルの内容を確認します：

```powershell
# .envファイルを開く（エディタで）
notepad .env
```

通常、ローカル環境では以下のような形式になっているはずです：

```env
DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
```

**この接続文字列の意味**：
- `postgresql://` - PostgreSQLプロトコル
- `postgres` - ユーザー名
- `052899skRvsun55` - パスワード
- `db.rivfzymqtbagbjqjyget.supabase.co` - ホスト名（ローカル/開発用）
- `5432` - ポート番号（通常のPostgreSQL接続）
- `postgres` - データベース名

### ステップ2: Vercel Dashboardで本番環境の接続文字列を確認

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクトを選択
3. **Settings** → **Environment Variables** をクリック
4. `DATABASE_URL` の値を確認（表示ボタンをクリック）

本番環境では、通常以下の2つの形式のいずれかが設定されています：

#### 形式1: 接続プーリング（Vercelでよく使われる）
```
postgresql://postgres.rivfzymqtbagbjqjyget:052899skRvsun55@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### 形式2: 通常の接続
```
postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres
```

**重要**: `prisma migrate deploy`は接続プーリング（`?pgbouncer=true`）をサポートしていません。そのため、**通常の接続（ポート5432）を使用する必要があります**。

### ステップ3: `.env`ファイルを一時的に変更

`.env`ファイルを開き、`DATABASE_URL`を本番環境の接続文字列に変更します。

**接続プーリングが設定されている場合**：
接続プーリングの接続文字列から、通常の接続文字列に変換する必要があります。

変換方法：
- `postgres.rivfzymqtbagbjqjyget` → `postgres`（ユーザー名からプロジェクト参照を削除）
- `aws-0-ap-south-1.pooler.supabase.com` → `db.rivfzymqtbagbjqjyget.supabase.co`（ホスト名を通常の形式に変更）
- `6543` → `5432`（ポートを通常のPostgreSQLポートに変更）
- `?pgbouncer=true` → 削除（パラメータを削除）

**例**：

変更前（ローカル用）：
```env
DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
```

変更後（本番環境用 - 一時的）：
```env
# ローカル用（コメントアウト）
# DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"

# 本番環境用（一時的に有効化）
DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
```

**注意**: パスワードはVercel Dashboardで確認した値を使用してください。上記は例です。

### ステップ4: マイグレーションを適用

PowerShellまたはコマンドプロンプトで、以下のコマンドを実行します：

```powershell
npx prisma migrate deploy
```

**このコマンドが行うこと**：
1. `prisma/migrations/`ディレクトリ内のすべてのマイグレーションファイルを確認
2. データベースの`_prisma_migrations`テーブルを確認
3. 未適用のマイグレーションを検出
4. 未適用のマイグレーションを順番に適用
5. 適用済みマイグレーションを`_prisma_migrations`テーブルに記録

**実行例**：

```powershell
PS C:\Users\ozroo\wedding-marketplace> npx prisma migrate deploy

Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.rivfzymqtbagbjqjyget.supabase.co:5432"

Applying migration `20260108231054_add_profile_categories`

The following migration(s) have been applied:

migrations/
  └─ 20260108231054_add_profile_categories/
    └─ migration.sql

All migrations have been successfully applied.
```

**成功時のメッセージ**：
- `All migrations have been successfully applied.` と表示されれば成功です。

**エラーが発生した場合**：
- 接続エラー: `.env`の接続文字列を確認
- 権限エラー: Supabaseのパスワードを確認
- テーブルが既に存在する: マイグレーションファイルに`IF NOT EXISTS`が含まれているか確認

### ステップ5: `.env`ファイルを元に戻す

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

### ステップ6: 動作確認（オプション）

マイグレーションが正しく適用されたか確認するには：

```powershell
# Prisma Studioでデータベースを確認（オプション）
npx prisma studio
```

または、Supabase Dashboardの**Table Editor**で`vendor_profile_categories`テーブルが作成されているか確認できます。

## よくある質問

### Q: 接続プーリングの接続文字列をそのまま使えますか？

A: いいえ。`prisma migrate deploy`は接続プーリングをサポートしていないため、通常の接続（ポート5432）を使用する必要があります。

### Q: パスワードが分からない場合は？

A: Vercel Dashboardの**Settings** → **Environment Variables**で`DATABASE_URL`の値を確認してください。表示ボタンをクリックすると、パスワードを含む完全な接続文字列が表示されます。

### Q: 複数のマイグレーションがある場合、すべて適用されますか？

A: はい。`prisma migrate deploy`は、未適用のマイグレーションをすべて順番に適用します。

### Q: マイグレーションを間違えて適用してしまった場合、どうすればいいですか？

A: ロールバック用のマイグレーションを作成するか、Supabase DashboardのSQL Editorから直接SQLを実行して修正してください。

### Q: この方法でローカルのデータベースに影響はありますか？

A: `.env`ファイルを本番環境の接続文字列に変更している間は、ローカルのデータベースではなく本番環境のデータベースに接続されます。そのため、`.env`を元に戻すまでは、ローカル開発は本番環境のデータベースを使用することになります。

### Q: `.env`ファイルを変更した後、Vercelに再デプロイする必要がありますか？

A: **いいえ、再デプロイは不要です。**

理由：
- `.env`ファイルはローカル環境の設定ファイルです
- Vercelは独自の環境変数（Vercel Dashboardで設定）を使用します
- `.env`ファイルの変更はVercelのデプロイには影響しません
- `prisma migrate deploy`はローカルの`.env`を読み込んで、ローカルから本番環境のデータベースに直接接続するだけです

**再デプロイが必要な場合**：
- マイグレーションファイル（`prisma/migrations/`内のファイル）をGitにプッシュした場合
  - これはコードの変更として扱われるため、Vercelが自動で再デプロイします
  - ただし、マイグレーションファイル自体は既にデータベースに適用されているので、再デプロイは正常に完了します

**再デプロイが不要な場合**：
- `.env`ファイルを変更しただけの場合
- `.env`ファイルを元に戻しただけの場合
- `prisma migrate deploy`を実行しただけの場合

**まとめ**：
1. `.env`を変更 → `prisma migrate deploy`実行 → `.env`を元に戻す
   - この一連の作業は**ローカルでの作業**なので、Vercelの再デプロイは不要
2. マイグレーションファイルをGitにプッシュ
   - これは**コードの変更**なので、Vercelが自動で再デプロイ（ただし、マイグレーションは既に適用済み）

## まとめ

方法Aの手順：

1. ✅ `.env`ファイルを開く
2. ✅ `DATABASE_URL`を本番環境の接続文字列（通常接続、ポート5432）に変更
3. ✅ `npx prisma migrate deploy`を実行
4. ✅ `.env`ファイルをローカル用に戻す

この方法により、マイグレーション履歴が自動管理され、次回以降も簡単にマイグレーションを適用できます。
