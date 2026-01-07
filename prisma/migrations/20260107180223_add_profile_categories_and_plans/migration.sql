-- AlterTable
ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "category_type" TEXT DEFAULT 'venue';
ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "max_guests" INTEGER;
ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "service_tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "plans" JSONB;

