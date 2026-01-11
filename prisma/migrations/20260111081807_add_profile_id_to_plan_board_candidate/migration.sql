-- AlterTable
ALTER TABLE "plan_board_candidates" ADD COLUMN "profile_id" TEXT;

-- AddForeignKey
ALTER TABLE "plan_board_candidates" ADD CONSTRAINT "plan_board_candidates_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "vendor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "plan_board_candidates_plan_board_slot_id_vendor_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "plan_board_candidates_plan_board_slot_id_vendor_id_profile_id_key" ON "plan_board_candidates"("plan_board_slot_id", "vendor_id", "profile_id");
