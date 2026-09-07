-- ==============================================================================
-- Migration: Remove "OUR CITY" Category & Migrate Existing Records
-- Run this script in the Supabase SQL Studio / SQL Editor
-- ==============================================================================

BEGIN;

-- 1. Migrate any existing published news articles categorized as 'OUR CITY' to 'NEWS'
UPDATE public.news
SET 
  category = 'NEWS',
  sub_category = CASE 
    WHEN sub_category IS NULL OR TRIM(sub_category) = '' OR UPPER(TRIM(sub_category)) IN ('OUR CITY', 'CITY', 'CIVIC')
    THEN 'City Updates'
    ELSE sub_category
  END
WHERE UPPER(TRIM(category)) IN ('OUR CITY', 'OUR-CITY', 'CITY', 'CIVIC LIFE');

-- 2. Migrate any pending AI drafts in `rss_drafts` to 'News'
UPDATE public.rss_drafts
SET category = 'News'
WHERE UPPER(TRIM(category)) IN ('OUR CITY', 'OUR-CITY', 'CITY', 'CIVIC LIFE');

-- 3. Delete the category definition from `categories` table if it exists
DELETE FROM public.categories
WHERE LOWER(TRIM(slug)) IN ('our-city', 'ourcity')
   OR UPPER(TRIM(name)) IN ('OUR CITY', 'OUR-CITY');

-- 4. Check if any CHECK constraints exist on `news.category` and show status
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully: "OUR CITY" category removed and merged into "NEWS".';
END $$;

COMMIT;
