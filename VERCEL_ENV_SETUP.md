# Vercel環境変数設定手順（詳細版）

## 問題

VercelにデプロイしたアプリケーションがSupabaseに接続できず、500エラーが発生しています。

**原因**: `.env`ファイルの環境変数はVercelに自動的に反映されません。Vercel Dashboardで手動で設定する必要があります。

## 解決手順

### ステップ1: `.env`ファイルから接続文字列をコピー

1. ローカルの `.env` ファイルを開く
2. `DATABASE_URL` の行を見つける（例：`DATABASE_URL="postgresql://postgres:...@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres"`）
3. 値全体（引用符も含む）をコピー

   **注意**: 
   - `DATABASE_URL=` の部分はコピーしない（値のみ）
   - 引用符は含めても含めなくても構いません

### ステップ2: Vercel Dashboardで環境変数を設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. **プロジェクトを選択**（wedding-marketplace）
3. 上部のメニューから **Settings** をクリック
4. 左サイドバーから **Environment Variables** をクリック
5. **Add New** ボタンをクリック
6. 以下の情報を入力：

   - **Key**: `DATABASE_URL`
   - **Value**: `.env`ファイルからコピーした接続文字列を貼り付け
     - 例：`postgresql://postgres:[パスワード]@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres`
   - **Environment**: 以下すべてにチェックを入れる
     - ✅ **Production**（本番環境）
     - ✅ **Preview**（プレビュー環境）
     - ✅ **Development**（開発環境）

7. **Save** ボタンをクリック

### ステップ3: 接続文字列が分からない場合

`.env`ファイルに`DATABASE_URL`がない、または確認できない場合は、Supabase Dashboardから取得できます：

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左サイドバーから **Settings**（⚙️アイコン）をクリック
4. **Database** をクリック
5. **Connection string** セクションまでスクロール
6. **URI** タブを選択
7. データベースパスワードを入力（プロジェクト作成時に設定したパスワード）
8. 表示された接続文字列をコピー

   形式：
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

   **または**（接続プーリングを使わない場合）：
   ```
   postgresql://postgres:[PASSWORD]@db.rivfzymqtbagbjqjyget.supabase.co:5432/postgres
   ```

### ステップ4: 再デプロイ

環境変数を設定した後は、**必ず再デプロイ**が必要です：

1. Vercel Dashboard → プロジェクト選択
2. **Deployments** タブをクリック
3. 最新のデプロイメントの右側にある **...**（三点メニュー）をクリック
4. **Redeploy** を選択
5. 確認ダイアログで **Redeploy** をクリック

または、GitHubに新しいコミットをプッシュして自動デプロイすることもできます。

### ステップ5: 動作確認

再デプロイが完了したら：

1. Vercel Dashboard → **Deployments** タブ
2. 最新のデプロイメントが **Ready** になっているか確認
3. デプロイされたサイトにアクセス
4. トップページにカテゴリが表示されるか確認
5. ベンダー登録ができるか確認

## よくある問題と解決方法

### 問題1: 環境変数を設定したのに、まだ500エラーが出る

**原因**: 再デプロイが実行されていない可能性があります。

**解決方法**:
1. Vercel Dashboardで再デプロイを実行
2. 環境変数がProduction、Preview、Developmentすべてに設定されているか確認
3. 接続文字列にパスワードが正しく含まれているか確認

### 問題2: 接続文字列の形式が分からない

**確認ポイント**:
- `postgresql://` で始まること
- `postgres:[パスワード]` の部分にパスワードが含まれていること
- `@db.rivfzymqtbagbjqjyget.supabase.co:5432` または `@aws-0-[REGION].pooler.supabase.com:6543` のような形式であること

### 問題3: パスワードを忘れた

1. Supabase Dashboard → Settings → Database
2. **Database password** セクションからリセットまたは確認
3. 新しいパスワードを設定した場合は、接続文字列を更新して再デプロイ

## 接続プーリングについて

Vercelのようなサーバーレス環境では、**接続プーリング**の使用を推奨します。

### 接続プーリングのURLの取得方法

1. Supabase Dashboard → Settings → Database
2. **Connection string** セクション
3. **Connection pooling** タブを選択
4. **Transaction** モードを選択（推奨）
5. パスワードを入力
6. 表示されたURLをコピー

形式：
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

このURLをVercelの環境変数 `DATABASE_URL` に設定してください。

## 確認チェックリスト

- [ ] `.env`ファイルから`DATABASE_URL`を確認
- [ ] Vercel Dashboardで環境変数`DATABASE_URL`を設定
- [ ] Production、Preview、Developmentすべてに環境変数を設定
- [ ] 接続文字列にパスワードが含まれているか確認
- [ ] 再デプロイを実行
- [ ] デプロイが完了したことを確認
- [ ] サイトにアクセスして動作確認

## 参考

- [Vercel環境変数のドキュメント](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase接続文字列のドキュメント](https://supabase.com/docs/guides/database/connecting-to-postgres)
