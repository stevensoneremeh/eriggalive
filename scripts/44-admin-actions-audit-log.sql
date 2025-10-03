-- Create admin actions audit log table
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Add indexes for performance
    CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions(target_type, target_id);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Admin actions are viewable by admins only" ON public.admin_actions;
CREATE POLICY "Admin actions are viewable by admins only"
    ON public.admin_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_user_id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'super_admin' OR users.tier = 'enterprise')
        )
        OR auth.jwt() ->> 'email' = 'info@eriggalive.com'
    );

DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;
CREATE POLICY "Admins can insert admin actions"
    ON public.admin_actions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_user_id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'super_admin' OR users.tier = 'enterprise')
        )
        OR auth.jwt() ->> 'email' = 'info@eriggalive.com'
    );

-- Add columns to withdrawals table for admin processing
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Create index for processed_by
CREATE INDEX IF NOT EXISTS idx_withdrawals_processed_by ON public.withdrawals(processed_by);

-- Add comment for documentation
COMMENT ON TABLE public.admin_actions IS 'Audit log for all admin actions performed in the system';
COMMENT ON COLUMN public.admin_actions.action_type IS 'Type of action performed (e.g., withdrawal_approve, withdrawal_reject, user_ban)';
COMMENT ON COLUMN public.admin_actions.target_type IS 'Type of entity the action was performed on (e.g., withdrawal, user, transaction)';
COMMENT ON COLUMN public.admin_actions.target_id IS 'ID of the entity the action was performed on';
COMMENT ON COLUMN public.admin_actions.details IS 'Additional details about the action in JSON format';