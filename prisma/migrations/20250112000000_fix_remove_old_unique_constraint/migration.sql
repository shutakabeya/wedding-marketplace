-- DropIndex: 古いユニーク制約を確実に削除
-- エラーログから、古い制約 (plan_board_slot_id, vendor_id) が残っていることが確認されたため、
-- CASCADEオプションを追加して確実に削除する
DROP INDEX IF EXISTS "plan_board_candidates_plan_board_slot_id_vendor_id_key" CASCADE;
