-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.users;

-- Create fixed RLS policies for users table
-- Users can view their own profile using auth.uid() directly
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = auth_user_id);

-- Users can update their own profile using auth.uid() directly  
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = auth_user_id);

-- Allow viewing of public profiles (non-sensitive data only)
CREATE POLICY "Public profiles viewable" ON public.users
    FOR SELECT USING (
        is_active = true 
        AND is_banned = false 
        AND auth.uid() IS NOT NULL
    );

-- Fix other policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
CREATE POLICY "Users can view own permissions" ON public.user_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = user_permissions.user_id 
            AND users.auth_user_id = auth.uid()::text
        )
    );

-- Fix transaction policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.coin_transactions;
CREATE POLICY "Users can view own transactions" ON public.coin_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = coin_transactions.user_id 
            AND users.auth_user_id = auth.uid()::text
        )
    );

-- Fix content access policies  
DROP POLICY IF EXISTS "Users can view their own content access" ON public.content_access;
CREATE POLICY "Users can view own content access" ON public.content_access
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = content_access.user_id 
            AND users.auth_user_id = auth.uid()::text
        )
    );

-- Fix ticket policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (user_id = auth.uid()::text);

-- Fix notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = notifications.user_id 
            AND users.auth_user_id = auth.uid()::text
        )
    );
