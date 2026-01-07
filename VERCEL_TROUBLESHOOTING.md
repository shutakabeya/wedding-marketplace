# Vercelデプロイ後のトラブルシューティング

## 現在の状況

✅ ローカルでマイグレーション実行済み  
✅ ローカルでシード実行済み  
❌ Vercelで500エラーが続いている

## 確認手順

### 1. Vercelの環境変数を確認

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクトを選択
3. **Settings** → **Environment Variables** を開く
4. `DATABASE_URL` が存在するか確認
5. 値が正しいか確認（以下の形式であること）

   ```
   postgresql://postgres:[PASSWORD]@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres
   ```

   **重要**: `[PASSWORD]` の部分は実際のSupabaseデータベースパスワードに置き換える必要があります。

### 2. 環境変数の設定方法

もし `DATABASE_URL` が設定されていない、または値が間違っている場合：

1. **Settings** → **Environment Variables** を開く
2. **Add New** をクリック
3. 以下を入力：
   - **Key**: `DATABASE_URL`
   - **Value**: Supabaseの接続文字列（下記を参照）
   - **Environment**: Production, Preview, Development すべてにチェック
4. **Save** をクリック

#### Supabase接続文字列の取得方法

**方法A: 通常の接続（推奨）**

1. Supabase Dashboard → プロジェクト選択
2. **Settings** → **Database** を開く
3. **Connection string** セクションを開く
4. **URI** タブを選択
5. パスワードを入力
6. 表示された接続文字列をコピー

**方法B: 接続プーリング（推奨・高パフォーマンス）**

1. Supabase Dashboard → プロジェクト選択
2. **Settings** → **Database** を開く
3. **Connection string** セクションを開く
4. **Connection pooling** タブを選択
5. **Transaction** モードを選択
6. パスワードを入力
7. 表示された接続文字列をコピー

   形式：
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### 3. Vercelで再デプロイ

環境変数を設定または変更した後は、**必ず再デプロイ**が必要です：

1. Vercel Dashboard → プロジェクト選択
2. **Deployments** タブを開く
3. 最新のデプロイメントの右側にある **...** メニューをクリック
4. **Redeploy** を選択
5. **Redeploy** ボタンをクリック

または、GitHubに新しいコミットをプッシュして自動デプロイすることもできます。

### 4. Vercelのログを確認

エラーの詳細を確認するには：

1. Vercel Dashboard → プロジェクト選択
2. **Deployments** タブを開く
3. 最新のデプロイメントをクリック
4. **Functions** タブを開く
5. `/api/vendors` などのエラーが発生している関数を選択
6. **View Function Logs** をクリックしてログを確認

#### よくあるエラーと対処法

**エラー: `P1001: Can't reach database server`**

- 原因: `DATABASE_URL` が正しく設定されていない、またはネットワーク接続の問題
- 対処法:
  1. 環境変数 `DATABASE_URL` を再確認
  2. Supabase Dashboardでデータベースが稼働しているか確認
  3. 接続文字列のパスワードが正しいか確認

**エラー: `P1000: Authentication failed`**

- 原因: データベースのパスワードが間違っている
- 対処法:
  1. Supabase Dashboard → Settings → Database → Database password を確認
  2. 環境変数 `DATABASE_URL` のパスワード部分を修正
  3. 再デプロイ

**エラー: `Error: Failed to collect page data`**

- 原因: ビルド時のデータベース接続エラー
- 対処法:
  1. 環境変数 `DATABASE_URL` が正しく設定されているか確認
  2. ビルド時のログを確認（Deployments → デプロイメントを選択 → Build Logs）
  3. `DATABASE_URL` がProduction環境で設定されているか確認

### 5. ビルドログの確認

ビルド時のエラーを確認：

1. Vercel Dashboard → プロジェクト選択
2. **Deployments** タブを開く
3. 最新のデプロイメントをクリック
4. **Build Logs** タブを開く
5. エラーメッセージを確認

### 6. 接続テスト（オプション）

ローカルで接続をテスト：

```powershell
# 環境変数を設定（.envファイルから読み込まれる）
npx prisma db pull

# または、直接接続テスト
npx prisma studio
```

これでSupabaseに接続できることを確認できます。

## よくある質問

### Q: 環境変数を設定したのに、まだ500エラーが出る

**A**: 環境変数を設定した後は、必ず再デプロイが必要です。また、以下の点を確認してください：
- 環境変数がProduction、Preview、Developmentすべてに設定されているか
- 接続文字列のパスワードが正しいか
- Vercelのログで実際のエラーメッセージを確認

### Q: ローカルでは動作するが、Vercelでは動作しない

**A**: これは環境変数の問題である可能性が高いです。以下を確認：
1. Vercel Dashboardで環境変数が設定されているか
2. 環境変数の値がローカルの`.env`ファイルと同じか
3. 接続プーリングのURLを使用しているか（Vercelでは接続プーリングを推奨）

### Q: 既にデータがあるのに、デプロイ後にデータが表示されない

**A**: マイグレーションとシードはSupabaseのデータベースに直接書き込まれるので、データは存在しているはずです。問題はVercelからの接続です。環境変数 `DATABASE_URL` が正しく設定されているか確認してください。
