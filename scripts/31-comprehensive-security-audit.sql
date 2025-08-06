-- =====================================================
-- COMPREHENSIVE SECURITY AUDIT IMPLEMENTATION
-- =====================================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TICKETS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;

-- Create comprehensive ticket policies
CREATE POLICY "Users can view their own tickets" ON public.tickets
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can create their own tickets" ON public.tickets
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can update their own tickets" ON public.tickets
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    ) WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Admins can manage all tickets" ON public.tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- EVENT RESERVATIONS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own reservations" ON public.event_reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON public.event_reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON public.event_reservations;

CREATE POLICY "Users can view their own reservations" ON public.event_reservations
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can create reservations" ON public.event_reservations
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can update their own reservations" ON public.event_reservations
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    ) WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Admins can manage all reservations" ON public.event_reservations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- VAULT VIEWS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own vault views" ON public.vault_views;
DROP POLICY IF EXISTS "Users can create their own vault views" ON public.vault_views;

CREATE POLICY "Users can view their own vault views" ON public.vault_views
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can create their own vault views" ON public.vault_views
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Admins can view all vault views" ON public.vault_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- COMMUNITY POSTS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.community_posts;

CREATE POLICY "Published posts are viewable by authenticated users" ON public.community_posts
    FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND is_published = true 
        AND is_deleted = false
        AND NOT EXISTS (
            SELECT 1 FROM public.user_blocks 
            WHERE blocker_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
            AND blocked_id = user_id
        )
    );

CREATE POLICY "Users can create their own posts" ON public.community_posts
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their own posts" ON public.community_posts
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    ) WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can delete their own posts" ON public.community_posts
    FOR DELETE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Moderators can manage posts" ON public.community_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('moderator', 'admin', 'super_admin')
        )
    );

-- =====================================================
-- STORE PURCHASES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own purchases" ON public.store_purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON public.store_purchases;

CREATE POLICY "Users can view their own purchases" ON public.store_purchases
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can create their own purchases" ON public.store_purchases
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Admins can view all purchases" ON public.store_purchases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- COIN TRANSACTIONS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.coin_transactions;

CREATE POLICY "Users can view their own coin transactions" ON public.coin_transactions
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can create their own coin transactions" ON public.coin_transactions
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Admins can manage all coin transactions" ON public.coin_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- COMMUNITY COMMENTS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.community_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.community_comments;

CREATE POLICY "Comments are viewable by authenticated users" ON public.community_comments
    FOR SELECT USING (
        auth.uid() IS NOT NULL 
        AND is_deleted = false
        AND NOT EXISTS (
            SELECT 1 FROM public.user_blocks 
            WHERE blocker_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
            AND blocked_id = user_id
        )
    );

CREATE POLICY "Users can create their own comments" ON public.community_comments
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their own comments" ON public.community_comments
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    ) WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can delete their own comments" ON public.community_comments
    FOR DELETE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- =====================================================
-- COMMUNITY VOTES TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.community_votes;
DROP POLICY IF EXISTS "Users can manage their own votes" ON public.community_votes;

CREATE POLICY "Votes are viewable by authenticated users" ON public.community_votes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own votes" ON public.community_votes
    FOR ALL USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- =====================================================
-- USER FOLLOWS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.user_follows;
DROP POLICY IF EXISTS "Users can manage their own follows" ON public.user_follows;

CREATE POLICY "Follows are viewable by authenticated users" ON public.user_follows
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own follows" ON public.user_follows
    FOR ALL USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = follower_id)
    );

-- =====================================================
-- USER BLOCKS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can manage their own blocks" ON public.user_blocks;

CREATE POLICY "Users can view their own blocks" ON public.user_blocks
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = blocker_id)
    );

CREATE POLICY "Users can manage their own blocks" ON public.user_blocks
    FOR ALL USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = blocker_id)
    );

-- =====================================================
-- REPORTS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;

CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = reporter_user_id)
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = reporter_user_id)
    );

CREATE POLICY "Moderators can manage all reports" ON public.reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('moderator', 'admin', 'super_admin')
        )
    );

-- =====================================================
-- NOTIFICATIONS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    ) WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- =====================================================
-- USER SESSIONS TABLE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;

CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- =====================================================
-- SECURE DATABASE FUNCTIONS
-- =====================================================

-- Update existing functions with security definer and fixed search paths
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN 'EGG-' || upper(substring(encode(gen_random_bytes(8), 'base64'), 1, 8)) || '-' || extract(epoch from now())::text;
END;
$$;

CREATE OR REPLACE FUNCTION generate_qr_code(email TEXT, name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN 'EGG-' || upper(substring(encode(sha256((email || name || extract(epoch from now())::text)::bytea), 'base64'), 1, 8)) || '-' || right(extract(epoch from now())::text, 6);
END;
$$;

-- Secure function to get user by auth_user_id
CREATE OR REPLACE FUNCTION get_user_by_auth_id(auth_user_id UUID)
RETURNS TABLE(id INTEGER, username TEXT, tier TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.tier::TEXT, u.role::TEXT
    FROM public.users u
    WHERE u.auth_user_id = get_user_by_auth_id.auth_user_id
    AND u.is_active = true
    AND u.is_banned = false;
END;
$$;

-- Secure function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
    AND is_banned = false;
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check role-based permissions
    CASE permission_name
        WHEN 'admin_access' THEN
            RETURN user_role IN ('admin', 'super_admin');
        WHEN 'moderator_access' THEN
            RETURN user_role IN ('moderator', 'admin', 'super_admin');
        WHEN 'user_access' THEN
            RETURN user_role IN ('user', 'moderator', 'admin', 'super_admin');
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;

-- =====================================================
-- AUTHENTICATION SECURITY ENHANCEMENTS
-- =====================================================

-- Create function to log authentication attempts
CREATE OR REPLACE FUNCTION log_auth_attempt(
    user_email TEXT,
    attempt_type TEXT,
    success BOOLEAN,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.auth_logs (
        user_email,
        attempt_type,
        success,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        user_email,
        attempt_type,
        success,
        ip_address,
        user_agent,
        now()
    );
END;
$$;

-- Create auth_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id BIGSERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('login', 'signup', 'password_reset', 'otp_verify')),
    success BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on auth_logs
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view auth logs
CREATE POLICY "Admins can view auth logs" ON public.auth_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- ADDITIONAL SECURITY MEASURES
-- =====================================================

-- Create function to validate user session
CREATE OR REPLACE FUNCTION validate_user_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT * INTO user_record
    FROM public.users
    WHERE auth_user_id = auth.uid();
    
    IF user_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF user_record.is_banned = true THEN
        RETURN FALSE;
    END IF;
    
    IF user_record.is_active = false THEN
        RETURN FALSE;
    END IF;
    
    -- Update last seen
    UPDATE public.users
    SET last_login = now()
    WHERE auth_user_id = auth.uid();
    
    RETURN TRUE;
END;
$$;

-- Create function to sanitize user input
CREATE OR REPLACE FUNCTION sanitize_text_input(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove potential XSS and SQL injection patterns
    input_text := regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi');
    input_text := regexp_replace(input_text, '<[^>]*>', '', 'g');
    input_text := regexp_replace(input_text, '(union|select|insert|update|delete|drop|create|alter|exec|execute)', '', 'gi');
    
    -- Trim and limit length
    input_text := trim(input_text);
    input_text := left(input_text, 10000);
    
    RETURN input_text;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_ticket_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_qr_code(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_auth_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_session() TO authenticated;
GRANT EXECUTE ON FUNCTION sanitize_text_input(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_auth_attempt(TEXT, TEXT, BOOLEAN, INET, TEXT) TO authenticated;

-- Create indexes for better performance on security-related queries
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON public.users(role, is_active, is_banned);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reservations_user_id ON public.event_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_published ON public.community_posts(user_id, is_published, is_deleted);
CREATE INDEX IF NOT EXISTS idx_auth_logs_email_created ON public.auth_logs(user_email, created_at);

-- =====================================================
-- SECURITY AUDIT COMPLETION
-- =====================================================

-- Log the security audit completion
INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    metadata
) VALUES (
    (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1),
    'SECURITY_AUDIT'::audit_action,
    'system',
    0,
    jsonb_build_object(
        'timestamp', now(),
        'operation', 'COMPREHENSIVE_SECURITY_AUDIT_APPLIED',
        'tables_secured', ARRAY[
            'tickets', 'event_reservations', 'vault_views', 
            'community_posts', 'store_purchases', 'coin_transactions',
            'user_sessions', 'notifications', 'user_follows',
            'user_blocks', 'reports', 'community_comments',
            'community_votes', 'auth_logs'
        ],
        'functions_secured', ARRAY[
            'generate_ticket_number', 'generate_qr_code',
            'get_user_by_auth_id', 'check_user_permission',
            'validate_user_session', 'sanitize_text_input',
            'log_auth_attempt'
        ]
    )
);

-- Final verification query
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'tickets', 'event_reservations', 'vault_views', 
    'community_posts', 'store_purchases', 'coin_transactions',
    'user_sessions', 'notifications', 'user_follows',
    'user_blocks', 'reports', 'community_comments',
    'community_votes', 'auth_logs'
)
ORDER BY tablename;
