-- Verify all required tables exist
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
    required_tables TEXT[] := ARRAY[
        'users',
        'community_categories', 
        'community_posts',
        'community_comments',
        'community_post_votes',
        'chat_messages',
        'chat_message_votes',
        'freebies_posts',
        'freebies_post_votes'
    ];
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All required tables exist ✓';
    END IF;
END $$;

-- Verify RLS is enabled
DO $$
DECLARE
    table_name TEXT;
    rls_tables TEXT[] := ARRAY[
        'users',
        'community_posts',
        'community_comments', 
        'community_post_votes',
        'chat_messages',
        'chat_message_votes',
        'freebies_posts',
        'freebies_post_votes'
    ];
BEGIN
    FOREACH table_name IN ARRAY rls_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' 
            AND c.relname = table_name
            AND c.relrowsecurity = true
        ) THEN
            RAISE EXCEPTION 'RLS not enabled for table: %', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'RLS enabled for all required tables ✓';
END $$;

-- Create sample data if tables are empty
INSERT INTO community_categories (name, slug, description, display_order, is_active)
SELECT * FROM (VALUES
    ('General Discussion', 'general', 'General community discussions', 1, true),
    ('Music & Bars', 'music', 'Share and discuss music and bars', 2, true),
    ('Events & News', 'events', 'Latest events and news updates', 3, true),
    ('Freebies & Giveaways', 'freebies', 'Free content and community giveaways', 4, true)
) AS v(name, slug, description, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM community_categories);

-- Verify sample categories were created
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM community_categories) = 0 THEN
        RAISE EXCEPTION 'Failed to create sample categories';
    ELSE
        RAISE NOTICE 'Sample categories created ✓';
    END IF;
END $$;

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '=== DEPLOYMENT VERIFICATION COMPLETE ===';
    RAISE NOTICE 'Database schema is ready for production deployment';
    RAISE NOTICE 'Required environment variables:';
    RAISE NOTICE '- NEXT_PUBLIC_SUPABASE_URL';
    RAISE NOTICE '- NEXT_PUBLIC_SUPABASE_ANON_KEY';
    RAISE NOTICE '- NEXT_PUBLIC_ABLY_API_KEY';
    RAISE NOTICE '- SUPABASE_SERVICE_ROLE_KEY';
    RAISE NOTICE '=== END VERIFICATION ===';
END $$;
