-- Deployment Verification Script for Erigga Fan Platform
-- Run this script to verify all tables exist and are properly configured

-- Check if all required tables exist
DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    -- List of required tables
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'users', 'products', 'orders', 'order_items', 
            'coin_transactions', 'product_reviews', 'community_posts',
            'community_comments', 'community_votes', 'community_categories'
        ])
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            missing_tables := array_append(missing_tables, table_name);
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
    SELECT COUNT(*) INTO product_count FROM products WHERE is_active = true;
    
    IF product_count = 0 THEN
        RAISE NOTICE 'Products table is empty. Sample products will be served from API fallback.';
    ELSE
        RAISE NOTICE 'Products table has % active products', product_count;
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

-- Verify environment variables are set (this will be checked by the application)
DO $$
BEGIN
    RAISE NOTICE 'Database verification complete!';
    RAISE NOTICE 'Make sure these environment variables are set in your deployment:';
    RAISE NOTICE '- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY';
    RAISE NOTICE '- PAYSTACK_SECRET_KEY';
    RAISE NOTICE '- SUPABASE_URL';
    RAISE NOTICE '- SUPABASE_ANON_KEY';
    RAISE NOTICE '- SUPABASE_SERVICE_ROLE_KEY';
END $$;
