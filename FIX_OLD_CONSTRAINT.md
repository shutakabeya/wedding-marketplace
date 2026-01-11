# 古いユニーク制約の解決方法

## 問題の説明

エラーログから、データベースに古いユニーク制約 `(plan_board_slot_id, vendor_id)` が残っていることが確認されました。

### 背景

1. **初期マイグレーション（20260106114428_init）**：
   - `CREATE UNIQUE INDEX "plan_board_candidates_plan_board_slot_id_vendor_id_key"` を作成
   - これは `(plan_board_slot_id, vendor_id)` の組み合わせで一意性を保証

2. **後続マイグレーション（20260111081807_add_profile_id_to_plan_board_candidate）**：
   - `DROP INDEX IF EXISTS "plan_board_candidates_plan_board_slot_id_vendor_id_key"` を実行
   - 新しい制約 `CREATE UNIQUE INDEX "plan_board_candidates_plan_board_slot_id_vendor_id_profile_id_key"` を作成

3. **問題**：
   - マイグレーションは「適用済み」とマークされているが、実際のデータベースには古い制約が残っている
   - これにより、同じ `(plan_board_slot_id, vendor_id)` の組み合わせで `profileId` が異なるレコードを作成しようとするとエラーが発生

## 解決方法

### 方法1: 直接SQLで削除（推奨）

Supabaseのダッシュボードまたはデータベースクライアントから、以下のSQLを実行してください：

```sql
DROP INDEX IF EXISTS "plan_board_candidates_plan_board_slot_id_vendor_id_key" CASCADE;
```

### 方法2: 新しいマイグレーションファイルを作成

1. `prisma/migrations/YYYYMMDDHHMMSS_remove_old_unique_constraint/migration.sql` を作成
2. 以下の内容を記述：

```sql
-- DropIndex
DROP INDEX IF EXISTS "plan_board_candidates_plan_board_slot_id_vendor_id_key" CASCADE;
```

3. `npx prisma migrate deploy` を実行してマイグレーションを適用

### 方法3: Prisma Studioまたはデータベースクライアントを使用

Supabaseのダッシュボードから：
1. SQL Editorを開く
2. 上記のSQLを実行

## 確認方法

削除後に、以下のSQLで確認できます：

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'plan_board_candidates'
ORDER BY indexname;
```

期待される結果：
- `plan_board_candidates_plan_board_slot_id_vendor_id_profile_id_key` のみが存在
- `plan_board_candidates_plan_board_slot_id_vendor_id_key` は存在しない

## 注意事項

- この操作はデータベースの構造を変更するため、本番環境では十分に注意してください
- バックアップを取得してから実行することを推奨します
- `CASCADE` オプションを使用すると、このインデックスに依存する他のオブジェクトも削除される可能性がありますが、通常は問題ありません
