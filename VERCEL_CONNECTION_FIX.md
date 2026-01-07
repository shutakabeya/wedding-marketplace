# Vercel接続エラー解決方法

## 現在の状況

✅ Vercelに`DATABASE_URL`は設定済み  
❌ まだ500エラーが発生している

## 考えられる問題

### 問題1: 接続プーリングを使用していない（最も可能性が高い）

Vercelのようなサーバーレス環境では、**通常の接続（ポート5432）ではなく、接続プーリング（ポート6543）を使用する必要があります**。

現在の接続文字列：
```
postgresql://postgres:052899skRvsun55@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres
```

この形式は、サーバーレス環境では接続プールの上限に達しやすく、エラーが発生する可能性があります。

### 解決方法: 接続プーリングのURLに変更

1. **Supabase Dashboardで接続プーリングのURLを取得**：
   - Supabase Dashboard → Settings → Database
   - **Connection string** セクションまでスクロール
   - **Connection pooling** タブを選択
   - **Transaction** モードを選択（推奨）
   - パスワード `052899skRvsun55` を入力
   - 表示された接続文字列をコピー

   形式（例）：
   ```
   postgresql://postgres.rivfzymqtbagbjqjyget:052899skRvsun55@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. **Vercelの環境変数を更新**：
   - Vercel Dashboard → Settings → Environment Variables
   - `DATABASE_URL` を選択
   - **Edit** をクリック
   - **Value** を接続プーリングのURLに変更
   - **Save** をクリック

3. **再デプロイ**：
   - Deployments タブ → 最新のデプロイメント → ... → Redeploy

## 問題2: 環境変数が正しい環境に設定されていない

確認手順：

1. Vercel Dashboard → Settings → Environment Variables
2. `DATABASE_URL` を選択
3. 以下がすべてチェックされているか確認：
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**

もしチェックされていない場合、**Edit** で設定して再デプロイしてください。

## 問題3: 再デプロイが実行されていない

環境変数を設定・変更した後は、**必ず再デプロイ**が必要です。

再デプロイ手順：
1. Vercel Dashboard → Deployments タブ
2. 最新のデプロイメントの右側の **...** をクリック
3. **Redeploy** を選択
4. **Redeploy** をクリック

## 問題4: 実際のエラーメッセージを確認する

Vercelのログを確認して、実際のエラーメッセージを見る：

1. **Vercel Dashboard** → プロジェクト選択
2. **Deployments** タブを開く
3. **最新のデプロイメント**をクリック
4. **Functions** タブを開く
5. `/api/vendors` などのエラーが発生している関数を選択
6. **View Function Logs** をクリック

または：

1. **Vercel Dashboard** → プロジェクト選択
2. **Logs** タブを開く（またはデプロイメントを選択して **Runtime Logs** タブ）
3. エラーメッセージを確認

### よくあるエラーメッセージ

**`P2024: Connection pool timeout`**
- 原因: 接続プールの上限に達している
- 解決方法: 接続プーリングのURLを使用

**`P1001: Can't reach database server`**
- 原因: ネットワーク接続の問題、またはSupabaseのファイアウォール設定
- 解決方法: 
  1. Supabase Dashboard → Settings → Database → Network restrictions を確認
  2. すべてのIPアドレスを許可する設定になっているか確認

**`P1000: Authentication failed`**
- 原因: パスワードが間違っている
- 解決方法: 接続文字列のパスワードを確認

## 推奨される解決手順（優先順位順）

### ステップ1: 接続プーリングのURLに変更（最重要）

1. Supabase Dashboard → Settings → Database → Connection string → Connection pooling
2. Transaction モードを選択
3. パスワードを入力
4. 接続文字列をコピー
5. Vercel Dashboard → Settings → Environment Variables → `DATABASE_URL` を編集
6. 接続プーリングのURLに変更
7. 再デプロイ

### ステップ2: Vercelのログを確認

実際のエラーメッセージを確認して、具体的な問題を特定する。

### ステップ3: 環境変数の環境設定を確認

Production、Preview、Developmentすべてに設定されているか確認。

## 確認チェックリスト

- [ ] 接続プーリングのURLを使用しているか（ポート6543）
- [ ] 環境変数がProduction、Preview、Developmentすべてに設定されているか
- [ ] 環境変数を設定・変更後に再デプロイを実行したか
- [ ] Vercelのログで実際のエラーメッセージを確認したか
- [ ] Supabaseのデータベースが稼働しているか確認したか

## 補足: 接続プーリングとは

接続プーリングは、データベース接続を効率的に管理する仕組みです。サーバーレス環境（Vercel、AWS Lambdaなど）では：

- 各リクエストが新しい接続を開く
- 通常の接続（ポート5432）では接続数に上限があり、すぐに上限に達する
- 接続プーリング（ポート6543）を使用することで、接続を共有し、効率的に管理できる

そのため、Vercelのようなサーバーレス環境では接続プーリングの使用を強く推奨します。
