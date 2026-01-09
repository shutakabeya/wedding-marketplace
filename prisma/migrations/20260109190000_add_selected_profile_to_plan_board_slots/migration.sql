-- AlterTable
ALTER TABLE "plan_board_slots"
ADD COLUMN "selected_profile_id" TEXT;

-- AddForeignKey
ALTER TABLE "plan_board_slots"
ADD CONSTRAINT "plan_board_slots_selected_profile_id_fkey"
FOREIGN KEY ("selected_profile_id") REFERENCES "vendor_profiles"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
