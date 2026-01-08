# 接続文字列の正しい設定方法（最終版）

## 重要なポイント

**ローカル環境と本番環境（Vercel）で異なる接続文字列を使用する必要があります。**

## 接続文字列の使い分け

### ローカル環境（`.env`ファイル）

通常の接続（ポート5432）を使用：

```
DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
```

**特徴**：
- ユーザー名: `postgres`
- ホスト名: `db.rivfzymqtbagbjqjyget.supabase.co`
- ポート: `5432`
- パラメータ: なし

### 本番環境（Vercel環境変数）

接続プーリング（ポート6543）を使用：

```
DATABASE_URL="postgresql://postgres.rivfzymqtbagbjqjyget:052899skRvsun55@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**特徴**：
- ユーザー名: `postgres.rivfzymqtbagbjqjyget`（プロジェクト参照を含む）
- ホスト名: `aws-0-ap-south-1.pooler.supabase.com`（接続プーラー用）
- ポート: `6543`
- パラメータ: `?pgbouncer=true`

## 設定手順

### ステップ1: ローカルの`.env`ファイルを修正

1. `.env`ファイルを開く
2. `DATABASE_URL`の行を以下のように変更：

   ```env
   DATABASE_URL="postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"
   ```

3. ファイルを保存

### ステップ2: Vercelの環境変数を確認

1. Vercel Dashboard → Settings → Environment Variables
2. `DATABASE_URL`が以下の形式になっているか確認：

   ```
   postgresql://postgres.rivfzymqtbagbjqjyget:052899skRvsun55@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

   もし異なる場合は、上記の形式に更新してください。

### ステップ3: ローカル環境でテスト

1. `.env`ファイルを保存後、開発サーバーを再起動
2. トップページにアクセスして、ベンダープロフィールが表示されるか確認

### ステップ4: Vercelで再デプロイ（必要に応じて）

Vercelの環境変数を変更した場合は、再デプロイが必要です。

## なぜ使い分ける必要があるのか

### ローカル環境（通常の接続）

- 開発中は常時接続が維持される
- 接続プーリングのオーバーヘッドは不要
- 通常の接続の方がシンプルでデバッグしやすい
- エラー「Tenant or user not found」が発生しない

### 本番環境（接続プーリング）

- サーバーレス環境では各リクエストが新しい接続を開く
- 通常の接続（ポート5432）では接続数に上限があり、すぐに上限に達する
- 接続プーリング（ポート6543）を使用することで、接続を共有し、効率的に管理できる
- Vercelのようなサーバーレス環境では必須

## 確認方法

### ローカル環境の接続確認

```powershell
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 にアクセス
# トップページにカテゴリとベンダーが表示されることを確認
```

### Vercel環境の接続確認

1. Vercel Dashboard → Deployments → 最新のデプロイメント → Runtime Logs
2. エラーメッセージが表示されていないか確認
3. `/api/debug/env` にアクセスして、接続文字列を確認

## トラブルシューティング

### ローカルで「Tenant or user not found」エラーが出る

**原因**: `.env`ファイルで接続プーリングのURLを使用している

**解決方法**: `.env`ファイルの`DATABASE_URL`を通常の接続（ポート5432）に変更

### Vercelで「Can't reach database server」エラーが出る

**原因**: Vercelの環境変数で通常の接続（ポート5432）を使用している、または環境変数が設定されていない

**解決方法**: Vercel Dashboardで環境変数を接続プーリングのURLに設定
