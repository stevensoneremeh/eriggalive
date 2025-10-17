-- =====================================================
-- AUTHENTICATION SECURITY CONFIGURATION
-- =====================================================

-- This script contains Supabase Auth configuration recommendations
-- These settings should be applied in your Supabase Dashboard > Authentication > Settings

/*
RECOMMENDED AUTH SETTINGS FOR SUPABASE DASHBOARD:

1. Site URL Configuration:
   - Site URL: https://your-domain.com
   - Additional redirect URLs: Add all your deployment URLs

2. Email Settings:
   - Enable email confirmations: ON
   - Enable email change confirmations: ON
   - Secure email change: ON (requires both old and new email confirmation)

3. Password Settings:
   - Minimum password length: 8 characters
   - Require uppercase: ON
   - Require lowercase: ON  
   - Require numbers: ON
   - Require special characters: ON

4. Session Settings:
   - JWT expiry: 3600 seconds (1 hour)
   - Refresh token rotation: ON
   - Reuse interval: 10 seconds

5. Security Settings:
   - Enable Captcha: ON (for production)
   - Rate limiting: ON
   - Max enrollment per IP: 3 per hour

6. OTP Settings:
   - OTP expiry: 900 seconds (15 minutes) - REDUCED FROM DEFAULT
   - OTP length: 6 digits

7. Multi-Factor Authentication:
   - Enable TOTP: ON
   - Enforce MFA for admin users: ON

8. Advanced Security:
   - Enable leaked password protection: ON
   - Session timeout: 24 hours
   - Concurrent sessions limit: 5

9. Webhook Settings:
   - Auth webhook URL: https://your-domain.com/api/auth/webhook
   - Webhook events: user.created, user.updated, user.deleted

10. Custom SMTP (Recommended for production):
    - Configure custom SMTP for better deliverability
    - Use your domain for sender email
*/

-- =====================================================
-- DATABASE-LEVEL AUTH SECURITY ENHANCEMENTS
-- =====================================================

-- Create enhanced user profile trigger for security
CREATE OR REPLACE FUNCTION handle_new_user_security()
RETURNS TRIGGER AS $$
DECLARE
    user_ip INET;
    user_agent TEXT;
BEGIN
    -- Get user metadata from auth.users if available
    SELECT 
        (raw_user_meta_data->>'ip_address')::INET,
        raw_user_meta_data->>'user_agent'
    INTO user_ip, user_agent
    FROM auth.users 
    WHERE id = NEW.auth_user_id;

    -- Log the new user creation
    INSERT INTO public.auth_logs (
        user_email,
        attempt_type,
        success,
        ip_address,
        user_agent
    ) VALUES (
        NEW.email,
        'signup',
        true,
        user_ip,
        user_agent
    );

    -- Set initial security defaults
    NEW.two_factor_enabled := false;
    NEW.email_verified := false;
    NEW.phone_verified := false;
    NEW.is_active := true;
    NEW.is_banned := false;
    NEW.login_count := 0;
    
    -- Generate secure referral code
    NEW.referral_code := upper(substring(encode(gen_random_bytes(6), 'base64'), 1, 8));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Update the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_security();

-- =====================================================
-- RATE LIMITING FUNCTIONS
-- =====================================================

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address or user ID
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action, window_start);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    identifier TEXT,
    action TEXT,
    max_requests INTEGER DEFAULT 10,
    window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    window_start := now() - (window_minutes || ' minutes')::INTERVAL;
    
    -- Clean old entries
    DELETE FROM public.rate_limits 
    WHERE window_start < (now() - (window_minutes || ' minutes')::INTERVAL);
    
    -- Get current count
    SELECT COALESCE(SUM(count), 0) INTO current_count
    FROM public.rate_limits
    WHERE rate_limits.identifier = check_rate_limit.identifier
    AND rate_limits.action = check_rate_limit.action
    AND rate_limits.window_start >= window_start;
    
    -- Check if limit exceeded
    IF current_count >= max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Increment counter
    INSERT INTO public.rate_limits (identifier, action, count)
    VALUES (identifier, action, 1)
    ON CONFLICT (identifier, action) 
    DO UPDATE SET 
        count = rate_limits.count + 1,
        created_at = now();
    
    RETURN TRUE;
END;
$$;

-- =====================================================
-- SUSPICIOUS ACTIVITY DETECTION
-- =====================================================

-- Create suspicious activity table
CREATE TABLE IF NOT EXISTS public.suspicious_activities (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id),
    activity_type TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INTEGER REFERENCES public.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on suspicious activities
ALTER TABLE public.suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Only admins can view suspicious activities
CREATE POLICY "Admins can manage suspicious activities" ON public.suspicious_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Function to log suspicious activity
CREATE OR REPLACE FUNCTION log_suspicious_activity(
    user_id INTEGER,
    activity_type TEXT,
    description TEXT,
    severity TEXT DEFAULT 'medium',
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.suspicious_activities (
        user_id,
        activity_type,
        description,
        severity,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        user_id,
        activity_type,
        description,
        severity,
        ip_address,
        user_agent,
        metadata
    );
    
    -- Auto-ban for critical activities
    IF severity = 'critical' THEN
        UPDATE public.users 
        SET 
            is_banned = true,
            ban_reason = 'Automatic ban due to critical suspicious activity: ' || activity_type,
            banned_until = now() + INTERVAL '24 hours'
        WHERE id = user_id;
    END IF;
END;
$$;

-- =====================================================
-- SESSION SECURITY ENHANCEMENTS
-- =====================================================

-- Enhanced session validation function
CREATE OR REPLACE FUNCTION validate_session_security(
    session_token TEXT DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_record RECORD;
    session_record RECORD;
    result JSONB;
BEGIN
    -- Get user record
    SELECT * INTO user_record
    FROM public.users
    WHERE auth_user_id = auth.uid();
    
    -- Initialize result
    result := jsonb_build_object(
        'valid', false,
        'user_id', null,
        'warnings', '[]'::jsonb
    );
    
    -- Check if user exists
    IF user_record IS NULL THEN
        result := jsonb_set(result, '{error}', '"User not found"');
        RETURN result;
    END IF;
    
    -- Check if user is banned
    IF user_record.is_banned = true THEN
        result := jsonb_set(result, '{error}', '"User is banned"');
        result := jsonb_set(result, '{ban_reason}', to_jsonb(user_record.ban_reason));
        RETURN result;
    END IF;
    
    -- Check if user is active
    IF user_record.is_active = false THEN
        result := jsonb_set(result, '{error}', '"User account is inactive"');
        RETURN result;
    END IF;
    
    -- Check for suspicious IP changes
    IF ip_address IS NOT NULL THEN
        SELECT * INTO session_record
        FROM public.user_sessions
        WHERE user_id = user_record.id
        AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF session_record IS NOT NULL AND session_record.ip_address != ip_address THEN
            result := jsonb_set(result, '{warnings}', 
                result->'warnings' || '["IP address changed"]'::jsonb
            );
            
            -- Log suspicious activity
            PERFORM log_suspicious_activity(
                user_record.id,
                'ip_change',
                'IP address changed from ' || session_record.ip_address::TEXT || ' to ' || ip_address::TEXT,
                'medium',
                ip_address,
                user_agent
            );
        END IF;
    END IF;
    
    -- Update session
    UPDATE public.user_sessions
    SET 
        last_activity = now(),
        ip_address = COALESCE(ip_address, ip_address),
        user_agent = COALESCE(user_agent, user_agent)
    WHERE user_id = user_record.id
    AND is_active = true;
    
    -- Set valid result
    result := jsonb_set(result, '{valid}', 'true');
    result := jsonb_set(result, '{user_id}', to_jsonb(user_record.id));
    result := jsonb_set(result, '{tier}', to_jsonb(user_record.tier));
    result := jsonb_set(result, '{role}', to_jsonb(user_record.role));
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_suspicious_activity(INTEGER, TEXT, TEXT, TEXT, INET, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_session_security(TEXT, INET, TEXT) TO authenticated;

-- =====================================================
-- SECURITY MONITORING VIEWS
-- =====================================================

-- Create security dashboard view for admins
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
    'failed_logins' as metric,
    COUNT(*) as value,
    'Last 24 hours' as period
FROM public.auth_logs 
WHERE attempt_type = 'login' 
AND success = false 
AND created_at >= now() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'suspicious_activities' as metric,
    COUNT(*) as value,
    'Last 24 hours' as period
FROM public.suspicious_activities 
WHERE created_at >= now() - INTERVAL '24 hours'
AND is_resolved = false

UNION ALL

SELECT 
    'banned_users' as metric,
    COUNT(*) as value,
    'Currently active' as period
FROM public.users 
WHERE is_banned = true

UNION ALL

SELECT 
    'active_sessions' as metric,
    COUNT(*) as value,
    'Currently active' as period
FROM public.user_sessions 
WHERE is_active = true
AND last_activity >= now() - INTERVAL '1 hour';

-- RLS for security dashboard
ALTER VIEW public.security_dashboard OWNER TO postgres;

-- Create policy for security dashboard
CREATE POLICY "Admins can view security dashboard" ON public.security_dashboard
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Final security audit log
INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    metadata
) VALUES (
    (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1),
    'SECURITY_CONFIG'::audit_action,
    'system',
    0,
    jsonb_build_object(
        'timestamp', now(),
        'operation', 'AUTHENTICATION_SECURITY_CONFIGURED',
        'features_enabled', ARRAY[
            'rate_limiting', 'suspicious_activity_detection',
            'enhanced_session_validation', 'security_monitoring'
        ]
    )
);
