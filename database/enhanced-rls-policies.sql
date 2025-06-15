-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.users;

-- Enhanced user policies with additional security checks
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (
        auth.uid() = auth_user_id 
        OR (
            is_active = true 
            AND is_banned = false 
            AND NOT is_deleted
        )
    );

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (
        auth.uid() = auth_user_id 
        AND is_active = true 
        AND NOT is_banned
    )
    WITH CHECK (
        auth.uid() = auth_user_id 
        AND is_active = true 
        AND NOT is_banned
    );

-- Prevent users from modifying sensitive fields
CREATE POLICY "users_update_restricted_fields" ON public.users
    FOR UPDATE USING (
        auth.uid() = auth_user_id
    )
    WITH CHECK (
        -- Prevent modification of sensitive fields
        (OLD.role = NEW.role OR auth.jwt() ->> 'role' = 'admin')
        AND (OLD.tier = NEW.tier OR auth.jwt() ->> 'role' = 'admin')
        AND (OLD.coins <= NEW.coins OR auth.jwt() ->> 'role' = 'admin')
        AND OLD.is_banned = NEW.is_banned
        AND OLD.is_active = NEW.is_active
    );

-- Enhanced post policies with tier-based access
CREATE POLICY "posts_select_with_tier_check" ON public.posts
    FOR SELECT USING (
        is_published = true 
        AND is_deleted = false
        AND (
            tier_required = 'grassroot'
            OR (
                tier_required = 'pioneer' AND 
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth_user_id = auth.uid() 
                    AND tier IN ('pioneer', 'elder', 'blood_brotherhood')
                )
            )
            OR (
                tier_required = 'elder' AND 
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth_user_id = auth.uid() 
                    AND tier IN ('elder', 'blood_brotherhood')
                )
            )
            OR (
                tier_required = 'blood_brotherhood' AND 
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth_user_id = auth.uid() 
                    AND tier = 'blood_brotherhood'
                )
            )
        )
    );

-- Secure coin transaction policies
CREATE POLICY "coin_transactions_select_own" ON public.coin_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = coin_transactions.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "coin_transactions_insert_valid" ON public.coin_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = coin_transactions.user_id 
            AND auth_user_id = auth.uid()
            AND is_active = true
            AND NOT is_banned
        )
        AND amount > 0
        AND transaction_type IN ('purchase', 'withdrawal', 'transfer', 'reward', 'deduction')
    );

-- Audit log security - only admins can read
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- User sessions - users can only see their own
CREATE POLICY "user_sessions_own_only" ON public.user_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = user_sessions.user_id 
            AND auth_user_id = auth.uid()
        )
    );

-- Media content with tier restrictions
CREATE POLICY "media_content_tier_restricted" ON public.media_content
    FOR SELECT USING (
        is_published = true
        AND (
            tier_access = 'grassroot'
            OR (
                tier_access = 'pioneer' AND 
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth_user_id = auth.uid() 
                    AND tier IN ('pioneer', 'elder', 'blood_brotherhood')
                )
            )
            OR (
                tier_access = 'elder' AND 
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth_user_id = auth.uid() 
                    AND tier IN ('elder', 'blood_brotherhood')
                )
            )
            OR (
                tier_access = 'blood_brotherhood' AND 
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth_user_id = auth.uid() 
                    AND tier = 'blood_brotherhood'
                )
            )
        )
    );

-- Function to check user tier level
CREATE OR REPLACE FUNCTION check_user_tier_level(required_tier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_tier text;
    tier_levels jsonb := '{"grassroot": 1, "pioneer": 2, "elder": 3, "blood_brotherhood": 4}';
BEGIN
    SELECT tier INTO user_tier
    FROM public.users
    WHERE auth_user_id = auth.uid();
    
    IF user_tier IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN (tier_levels ->> user_tier)::int >= (tier_levels ->> required_tier)::int;
END;
$$;

-- Function to validate coin transactions
CREATE OR REPLACE FUNCTION validate_coin_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_balance integer;
    user_active boolean;
BEGIN
    -- Get user's current balance and status
    SELECT coins, is_active INTO user_balance, user_active
    FROM public.users
    WHERE id = NEW.user_id;
    
    -- Check if user is active
    IF NOT user_active THEN
        RAISE EXCEPTION 'User account is not active';
    END IF;
    
    -- For deductions, check sufficient balance
    IF NEW.transaction_type = 'deduction' AND user_balance < ABS(NEW.amount) THEN
        RAISE EXCEPTION 'Insufficient coin balance';
    END IF;
    
    -- Validate transaction amount
    IF NEW.amount = 0 THEN
        RAISE EXCEPTION 'Transaction amount cannot be zero';
    END IF;
    
    -- Set transaction timestamp
    NEW.created_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Create trigger for coin transaction validation
DROP TRIGGER IF EXISTS validate_coin_transaction_trigger ON public.coin_transactions;
CREATE TRIGGER validate_coin_transaction_trigger
    BEFORE INSERT ON public.coin_transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_coin_transaction();

-- Function to update user coins after transaction
CREATE OR REPLACE FUNCTION update_user_coins_after_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update user's coin balance
    UPDATE public.users
    SET 
        coins = coins + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Log the balance update
    INSERT INTO public.audit_logs (
        action,
        user_id,
        table_name,
        record_id,
        new_values,
        created_at
    ) VALUES (
        'COIN_BALANCE_UPDATED',
        NEW.user_id,
        'users',
        NEW.user_id,
        jsonb_build_object(
            'transaction_id', NEW.id,
            'amount', NEW.amount,
            'transaction_type', NEW.transaction_type,
            'new_balance', (SELECT coins FROM public.users WHERE id = NEW.user_id)
        ),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for updating user coins
DROP TRIGGER IF EXISTS update_user_coins_trigger ON public.coin_transactions;
CREATE TRIGGER update_user_coins_trigger
    AFTER INSERT ON public.coin_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_coins_after_transaction();

-- Function to prevent unauthorized role changes
CREATE OR REPLACE FUNCTION prevent_unauthorized_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Get current user's role
    SELECT role INTO current_user_role
    FROM public.users
    WHERE auth_user_id = auth.uid();
    
    -- Only admins can change roles
    IF OLD.role != NEW.role AND current_user_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Unauthorized role modification';
    END IF;
    
    -- Only super_admins can create other admins
    IF NEW.role IN ('admin', 'super_admin') AND current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Insufficient privileges to assign admin role';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for role change protection
DROP TRIGGER IF EXISTS prevent_role_changes_trigger ON public.users;
CREATE TRIGGER prevent_role_changes_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_unauthorized_role_changes();
