-- Create or replace the increment_total_earned function with proper error handling
CREATE OR REPLACE FUNCTION public.increment_total_earned(p_user_id uuid, p_amount numeric)
RETURNS VOID AS $$
DECLARE
    v_current_balance numeric := 0;
    v_current_earned numeric := 0;
BEGIN
    -- First, try to update existing wallet
    UPDATE public.user_wallets
    SET
        coin_balance = coin_balance + p_amount,
        total_earned = total_earned + p_amount,
        last_transaction_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- If no rows were updated, create a new wallet entry
    IF NOT FOUND THEN
        INSERT INTO public.user_wallets (
            user_id, 
            coin_balance, 
            total_earned, 
            last_transaction_at, 
            created_at,
            updated_at
        )
        VALUES (
            p_user_id, 
            p_amount, 
            p_amount, 
            NOW(), 
            NOW(),
            NOW()
        );
    END IF;

    -- Also update the users table for backward compatibility
    UPDATE public.users
    SET
        coins = COALESCE(coins, 0) + p_amount,
        updated_at = NOW()
    WHERE auth_user_id = p_user_id;

    -- Log the transaction for audit purposes
    INSERT INTO public.coin_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        status,
        created_at
    )
    VALUES (
        p_user_id,
        p_amount,
        'purchase',
        'Coin purchase via Paystack',
        'completed',
        NOW()
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE NOTICE 'Error in increment_total_earned: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set the search path for security
ALTER FUNCTION public.increment_total_earned(uuid, numeric) SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_total_earned(uuid, numeric) TO authenticated;

-- Create user_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coin_balance numeric DEFAULT 0 NOT NULL,
    total_earned numeric DEFAULT 0 NOT NULL,
    total_spent numeric DEFAULT 0 NOT NULL,
    last_transaction_at timestamptz,
    created_at timestamptz DEFAULT NOW() NOT NULL,
    updated_at timestamptz DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Create coin_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'reward', 'refund')),
    description text,
    status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT NOW() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own wallet" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own coin transactions" ON public.coin_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON public.coin_transactions(created_at DESC);
