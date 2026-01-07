-- AlterTable
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;

-- AlterTable
ALTER TABLE "vendor_profiles" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
