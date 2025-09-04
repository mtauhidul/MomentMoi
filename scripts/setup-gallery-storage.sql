-- VENDOR GALLERY STORAGE SETUP
-- This script provides instructions for setting up storage for vendor galleries

-- 1. MANUAL SETUP IN SUPABASE DASHBOARD:
-- Go to your Supabase Dashboard → Storage → Create Bucket
-- Bucket Name: vendor-gallery
-- Make it public: Yes

-- 2. STORAGE POLICIES (Optional - for enhanced security):
-- If you want additional storage-level security, you can set up these policies
-- in the bucket settings, but they're not strictly necessary since we handle
-- security at the database level with RLS policies.

-- For now, the application will work with just a public bucket.
-- Security is handled through the vendor_gallery table RLS policies
-- and the useImageUpload hook's validation.
