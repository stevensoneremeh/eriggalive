-- Deployment Verification Script for Erigga Fan Platform
-- Run this script to verify all tables exist and are properly configured

-- Check if all required tables exist
DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    tbl_name TEXT;
    table_exists BOOLEAN;
BEGIN
    -- List of required tables
    FOR tbl_name IN 
        SELECT unnest(ARRAY[
            'users', 'products', 'orders', 'order_items', 
            'coin_transactions', 'product_reviews', 'community_posts',
            'community_comments', 'community_votes', 'community_categories'
        ])
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = tbl_name
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            missing_tables := array_append(missing_tables, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE 'Please run the appropriate schema scripts to create missing tables.';
    ELSE
        RAISE NOTICE 'All required tables exist!';
    END IF;
END $$;

-- Verify products table has sample data
DO $$
DECLARE
    product_count INTEGER;
BEGIN
    -- Check if products table exists first
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        SELECT COUNT(*) INTO product_count FROM products WHERE is_active = true;
        
        IF product_count = 0 THEN
            RAISE NOTICE 'Products table is empty. Sample products will be served from API fallback.';
        ELSE
            RAISE NOTICE 'Products table has % active products', product_count;
        END IF;
    ELSE
        RAISE NOTICE 'Products table does not exist. API will serve fallback sample products.';
    END IF;
END $$;

-- Check RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('products', 'orders', 'order_items');
    
    IF policy_count > 0 THEN
        RAISE NOTICE 'RLS policies are configured (% policies found)', policy_count;
    ELSE
        RAISE NOTICE 'Warning: No RLS policies found. Security may be compromised.';
    END IF;
END $$;

-- Check if users table has the required columns
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if users table exists first
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'coin_balance'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE 'Users table has coin_balance column - coin payments will work';
        ELSE
            RAISE NOTICE 'Warning: Users table missing coin_balance column - coin payments may fail';
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist - authentication may not work properly';
    END IF;
END $$;

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '=== DEPLOYMENT VERIFICATION COMPLETE ===';
    RAISE NOTICE 'Make sure these environment variables are set in your deployment:';
    RAISE NOTICE '- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (for frontend)';
    RAISE NOTICE '- PAYSTACK_SECRET_KEY (for backend verification)';
    RAISE NOTICE '- SUPABASE_URL';
    RAISE NOTICE '- SUPABASE_ANON_KEY';
    RAISE NOTICE '- SUPABASE_SERVICE_ROLE_KEY';
    RAISE NOTICE '';
    RAISE NOTICE 'The merch store will work with fallback data even if tables are missing.';
    RAISE NOTICE 'Run scripts/33-merch-store-schema.sql to create the full database schema.';
END $$;
