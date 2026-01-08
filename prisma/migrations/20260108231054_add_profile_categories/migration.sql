-- CreateTable
CREATE TABLE IF NOT EXISTS "vendor_profile_categories" (
    "profile_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "vendor_profile_categories_pkey" PRIMARY KEY ("profile_id","category_id")
);

-- AddForeignKey (IF NOT EXISTS を使用)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vendor_profile_categories_profile_id_fkey'
    ) THEN
        ALTER TABLE "vendor_profile_categories" 
        ADD CONSTRAINT "vendor_profile_categories_profile_id_fkey" 
        FOREIGN KEY ("profile_id") 
        REFERENCES "vendor_profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (IF NOT EXISTS を使用)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vendor_profile_categories_category_id_fkey'
    ) THEN
        ALTER TABLE "vendor_profile_categories" 
        ADD CONSTRAINT "vendor_profile_categories_category_id_fkey" 
        FOREIGN KEY ("category_id") 
        REFERENCES "categories"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
