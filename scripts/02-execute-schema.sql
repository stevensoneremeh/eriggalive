-- Run the complete schema from your existing files
-- This is a placeholder - you should run your actual schema files in order
-- 01-extensions-and-types.sql through 10-seed-data.sql

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
