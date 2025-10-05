-- Create comprehensive database schema for transactions and withdrawals system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transactions table for Paystack payments
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reference TEXT UNIQUE NOT NULL, -- Paystack transaction reference
    amount BIGINT NOT NULL, -- Amount in kobo (Nigerian currency)
    coins_credited BIGINT NOT NULL, -- Number of coins credited
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    payment_method TEXT DEFAULT 'paystack',
    paystack_data JSONB, -- Store full Paystack response
    metadata JSONB, -- Additional transaction metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    INDEX idx_transactions_user_id (user_id),
    INDEX idx_transactions_reference (reference),
    INDEX idx_transactions_status (status),
    INDEX idx_transactions_created_at (created_at)
);

-- Create bank_accounts table for user bank details
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL,
    bank_code TEXT NOT NULL, -- Nigerian bank code
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL, -- Verified account name from bank
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    verification_data JSONB, -- Store bank verification response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active account per user
    UNIQUE(user_id, account_number, bank_code),
    
    -- Indexes
    INDEX idx_bank_accounts_user_id (user_id),
    INDEX idx_bank_accounts_active (user_id, is_active) WHERE is_active = TRUE
);

-- Create withdrawals table for withdrawal requests
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
    amount_coins BIGINT NOT NULL CHECK (amount_coins >= 100000), -- Minimum 100,000 coins
    amount_naira BIGINT NOT NULL, -- Amount in kobo (100,000 coins = ₦10,000 = 1,000,000 kobo)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
    admin_notes TEXT, -- Admin can add notes
    rejection_reason TEXT, -- Reason for rejection
    processed_by UUID REFERENCES auth.users(id), -- Admin who processed the request
    processed_at TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT, -- External payment reference if processed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_withdrawals_user_id (user_id),
    INDEX idx_withdrawals_status (status),
    INDEX idx_withdrawals_created_at (created_at),
    INDEX idx_withdrawals_processed_by (processed_by)
);

-- Create admin_users table for admin access control
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    permissions JSONB DEFAULT '["withdrawals", "users", "transactions"]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_admin_users_email (email),
    INDEX idx_admin_users_active (is_active) WHERE is_active = TRUE
);

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON public.withdrawals;
CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Bank accounts policies
DROP POLICY IF EXISTS "Users can manage their own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can manage their own bank accounts" ON public.bank_accounts
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all bank accounts" ON public.bank_accounts;
CREATE POLICY "Admins can view all bank accounts" ON public.bank_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Withdrawals policies
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can create their own withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

-- Admin users policies
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
CREATE POLICY "Super admins can manage admin users" ON public.admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
        )
    );

-- Create function to automatically deduct coins on withdrawal creation
CREATE OR REPLACE FUNCTION handle_withdrawal_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has enough coins
    IF (SELECT coins FROM public.users WHERE auth_user_id = NEW.user_id) < NEW.amount_coins THEN
        RAISE EXCEPTION 'Insufficient coins for withdrawal';
    END IF;
    
    -- Deduct coins from user account
    UPDATE public.users 
    SET coins = coins - NEW.amount_coins,
        updated_at = NOW()
    WHERE auth_user_id = NEW.user_id;
    
    -- Create a coin transaction record
    INSERT INTO public.coin_transactions (
        user_id, 
        amount, 
        transaction_type, 
        description, 
        status
    ) VALUES (
        NEW.user_id,
        -NEW.amount_coins,
        'withdrawal',
        'Withdrawal request: ' || NEW.amount_coins || ' coins to ₦' || (NEW.amount_naira / 100),
        'completed'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal creation
DROP TRIGGER IF EXISTS trigger_withdrawal_creation ON public.withdrawals;
CREATE TRIGGER trigger_withdrawal_creation
    AFTER INSERT ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION handle_withdrawal_creation();

-- Create function to handle withdrawal status changes
CREATE OR REPLACE FUNCTION handle_withdrawal_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If withdrawal is rejected, refund the coins
    IF OLD.status != 'rejected' AND NEW.status = 'rejected' THEN
        -- Refund coins to user account
        UPDATE public.users 
        SET coins = coins + NEW.amount_coins,
            updated_at = NOW()
        WHERE auth_user_id = NEW.user_id;
        
        -- Create a refund coin transaction record
        INSERT INTO public.coin_transactions (
            user_id, 
            amount, 
            transaction_type, 
            description, 
            status
        ) VALUES (
            NEW.user_id,
            NEW.amount_coins,
            'refund',
            'Withdrawal refund: ' || NEW.amount_coins || ' coins (Withdrawal ID: ' || NEW.id || ')',
            'completed'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal status changes
DROP TRIGGER IF EXISTS trigger_withdrawal_status_change ON public.withdrawals;
CREATE TRIGGER trigger_withdrawal_status_change
    AFTER UPDATE ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION handle_withdrawal_status_change();

-- Insert initial admin user (will be configured via environment variable)
-- This will be handled by the application code based on ADMIN_EMAIL env var

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_coins ON public.users(coins) WHERE coins >= 100000;
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_type ON public.coin_transactions(user_id, transaction_type);

-- Add comments for documentation
COMMENT ON TABLE public.transactions IS 'Stores Paystack payment transactions for coin purchases';
COMMENT ON TABLE public.bank_accounts IS 'Stores verified user bank account details for withdrawals';
COMMENT ON TABLE public.withdrawals IS 'Stores withdrawal requests with approval workflow';
COMMENT ON TABLE public.admin_users IS 'Stores admin user access control';

COMMENT ON COLUMN public.transactions.amount IS 'Amount in kobo (Nigerian currency)';
COMMENT ON COLUMN public.transactions.coins_credited IS 'Number of coins credited to user account';
COMMENT ON COLUMN public.withdrawals.amount_coins IS 'Amount in coins (minimum 100,000)';
COMMENT ON COLUMN public.withdrawals.amount_naira IS 'Amount in kobo (100,000 coins = ₦10,000)';
