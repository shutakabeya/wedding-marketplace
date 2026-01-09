-- CreateTable
CREATE TABLE "genie_plans" (
    "id" TEXT NOT NULL,
    "couple_id" TEXT NOT NULL,
    "plan_name" TEXT,
    "input_snapshot" JSONB NOT NULL,
    "plan_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genie_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "genie_plans_couple_id_idx" ON "genie_plans"("couple_id");

-- AddForeignKey
ALTER TABLE "genie_plans" ADD CONSTRAINT "genie_plans_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples"("id") ON DELETE CASCADE ON UPDATE CASCADE;
