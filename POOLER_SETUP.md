# Supabase接続プーリング（Transaction Mode）設定方法

## 正しい接続文字列の形式

Supabase Dashboardから取得したTransaction modeの接続文字列を、Prismaで使用するために以下の形式に修正してください：

### 元の形式（Supabase Dashboardから）
```
postgres://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnopqrst.supabase.co:6543/postgres
```

### Prisma用の正しい形式
```
postgresql://postgres:[YOUR-PASSWORD]@db.rivfzymqtbagbjqjyget.supabase.co:6543/postgres?pgbouncer=true
```

## 変更点

1. **`postgres://` → `postgresql://`**: Prismaでは後者を推奨します
2. **`?pgbouncer=true` を追加**: Transaction modeでは準備されたステートメントを無効化する必要があります

## 実際の設定手順

### ステップ1: 接続文字列を構築

あなたのプロジェクトの場合：

```
postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:6543/postgres?pgbouncer=true
```

**注意**:
- `postgres` はユーザー名（変更不要）
- `052899skRvsun55` はあなたのパスワード
- `db.rivfzymqtbagbjqjyget.supabase.co` はあなたのプロジェクト参照
- `6543` は接続プーリングのポート
- `?pgbouncer=true` は必須パラメータ

### ステップ2: Vercelの環境変数を更新

1. **Vercel Dashboard** → プロジェクト選択
2. **Settings** → **Environment Variables**
3. `DATABASE_URL` を選択
4. **Edit** をクリック
5. **Value** を以下のように更新：
   ```
   postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:6543/postgres?pgbouncer=true
   ```
6. **Save** をクリック

### ステップ3: 再デプロイ

1. **Deployments** タブを開く
2. 最新のデプロイメントの右側の **...** をクリック
3. **Redeploy** を選択

## Transaction Modeについて

Transaction modeは：
- ✅ サーバーレス環境（Vercel、AWS Lambdaなど）に最適
- ✅ 多くの一時的な接続を効率的に処理
- ❌ 準備されたステートメント（prepared statements）をサポートしない

Prismaは接続文字列に `?pgbouncer=true` がある場合、自動的に準備されたステートメントを無効化します。

## 確認

接続文字列が正しく設定されているか確認：

1. Vercel Dashboard → Settings → Environment Variables
2. `DATABASE_URL` を確認
3. 以下の形式であることを確認：
   - `postgresql://` で始まる
   - ポートが `6543` である
   - `?pgbouncer=true` で終わる

## トラブルシューティング

### エラー: `prepared statement` 関連のエラー

**原因**: `?pgbouncer=true` パラメータが欠けている

**解決方法**: 接続文字列に `?pgbouncer=true` を追加

### エラー: 接続タイムアウト

**原因**: ポート番号が間違っている（5432ではなく6543を使用する必要がある）

**解決方法**: 接続文字列のポートを `6543` に変更

### まだ500エラーが出る

1. Vercelのログを確認（Deployments → 最新のデプロイメント → Functions Logs）
2. 実際のエラーメッセージを確認
3. 環境変数がProduction、Preview、Developmentすべてに設定されているか確認
