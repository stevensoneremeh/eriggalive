
-- Admin audit logs for tracking administrative actions
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_table_name ON public.admin_audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_record_id ON public.admin_audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" 
    ON public.admin_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_user_id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'super_admin' OR users.tier = 'enterprise')
        )
        OR auth.jwt() ->> 'email' = 'info@eriggalive.com'
    );

-- Only admins can insert audit logs
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs" 
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_user_id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'super_admin' OR users.tier = 'enterprise')
        )
        OR auth.jwt() ->> 'email' = 'info@eriggalive.com'
    );

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.admin_audit_logs (
        admin_user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        details
    ) VALUES (
        auth.uid(),
        p_action,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        p_details
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, UUID, JSONB, JSONB, JSONB) TO authenticated;
