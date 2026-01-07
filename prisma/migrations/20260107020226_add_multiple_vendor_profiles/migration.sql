/*
  Warnings:

  - The primary key for the `vendor_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `vendor_profiles` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- Step 1: Add new columns (nullable first)
ALTER TABLE "vendor_profiles" 
ADD COLUMN IF NOT EXISTS "id" TEXT,
ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Step 2: Populate id for existing rows (using gen_random_uuid() for PostgreSQL)
UPDATE "vendor_profiles" 
SET "id" = gen_random_uuid()::text 
WHERE "id" IS NULL;

-- Step 3: Set existing profiles as default and set default name
UPDATE "vendor_profiles" 
SET "is_default" = true, 
    "name" = COALESCE("name", 'デフォルトプロフィール')
WHERE "is_default" IS NULL OR "is_default" = false;

-- Step 4: Make id NOT NULL and set as primary key
ALTER TABLE "vendor_profiles" 
ALTER COLUMN "id" SET NOT NULL,
DROP CONSTRAINT IF EXISTS "vendor_profiles_pkey",
ADD CONSTRAINT "vendor_profiles_pkey" PRIMARY KEY ("id");

-- Step 5: Create index
CREATE INDEX IF NOT EXISTS "vendor_profiles_vendor_id_idx" ON "vendor_profiles"("vendor_id");
