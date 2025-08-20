-- Enhanced Database Schema for Transactions and Withdrawals
-- This script sets up the necessary tables and policies for coin transactions and withdrawal system

-- First, let's enhance the existing coin_transactions table if needed
-- Add columns for Paystack integration if they don't exist
DO $$ 
BEGIN
    -- Add paystack_reference column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coin_transactions' AND column_name = 'paystack_reference') THEN
        ALTER TABLE coin_transactions ADD COLUMN paystack_reference TEXT;
    END IF;
    
    -- Add metadata column for storing additional transaction data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coin_transactions' AND column_name = 'metadata') THEN
        ALTER TABLE coin_transactions ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Add payment_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'coin_transactions' AND column_name = 'payment_method') THEN
        ALTER TABLE coin_transactions ADD COLUMN payment_method TEXT DEFAULT 'paystack';
    END IF;
END $$;

-- Create withdrawals table for managing withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
    amount_coins BIGINT NOT NULL CHECK (amount_coins >= 100000), -- Minimum 100,000 coins
    amount_naira INTEGER NOT NULL, -- Equivalent amount in Naira (kobo)
    exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 10.0, -- Coins to Naira rate (100,000 coins = ₦10,000)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_date TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    admin_notes TEXT,
    rejection_reason TEXT,
    payment_reference TEXT, -- For tracking external payment
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_status ON coin_transactions(status);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_paystack_ref ON coin_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_request_date ON withdrawals(request_date DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_processed_by ON withdrawals(processed_by);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_verified ON bank_accounts(is_verified);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to withdrawals table
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger to bank_accounts table if it doesn't exist
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON coin_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON coin_transactions;

DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can update their pending withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;

DROP POLICY IF EXISTS "Users can view their own bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can manage their own bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Admins can view all bank accounts" ON bank_accounts;

-- RLS Policies for coin_transactions
CREATE POLICY "Users can view their own transactions" ON coin_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON coin_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON coin_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.tier IN ('elder', 'blood_brotherhood')
        )
    );

CREATE POLICY "System can insert transactions" ON coin_transactions
    FOR INSERT WITH CHECK (true); -- Allow system/webhook insertions

-- RLS Policies for withdrawals
CREATE POLICY "Users can view their own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their pending withdrawals" ON withdrawals
    FOR UPDATE USING (
        auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id)
        AND status = 'pending'
    );

CREATE POLICY "Admins can view all withdrawals" ON withdrawals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.tier IN ('elder', 'blood_brotherhood')
        )
    );

CREATE POLICY "Admins can update withdrawals" ON withdrawals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.tier IN ('elder', 'blood_brotherhood')
        )
    );

-- RLS Policies for bank_accounts
CREATE POLICY "Users can view their own bank accounts" ON bank_accounts
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can manage their own bank accounts" ON bank_accounts
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Admins can view all bank accounts" ON bank_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.tier IN ('elder', 'blood_brotherhood')
        )
    );

-- Create function to handle coin balance updates
CREATE OR REPLACE FUNCTION update_user_coin_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update balance for completed purchase transactions
    IF NEW.transaction_type = 'purchase' AND NEW.status = 'completed' THEN
        UPDATE users 
        SET coins = coins + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    -- Handle withdrawal deductions
    IF NEW.transaction_type = 'withdrawal' AND NEW.status = 'completed' THEN
        UPDATE users 
        SET coins = coins - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic coin balance updates
DROP TRIGGER IF EXISTS coin_balance_update_trigger ON coin_transactions;
CREATE TRIGGER coin_balance_update_trigger
    AFTER INSERT OR UPDATE ON coin_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_coin_balance();

-- Create function to validate withdrawal requests
CREATE OR REPLACE FUNCTION validate_withdrawal_request()
RETURNS TRIGGER AS $$
DECLARE
    user_coin_balance BIGINT;
    user_auth_id UUID;
BEGIN
    -- Get user's current coin balance and auth_user_id
    SELECT coins, auth_user_id INTO user_coin_balance, user_auth_id
    FROM users WHERE id = NEW.user_id;
    
    -- Check if user has sufficient coins
    IF user_coin_balance < NEW.amount_coins THEN
        RAISE EXCEPTION 'Insufficient coin balance. Required: %, Available: %', 
            NEW.amount_coins, user_coin_balance;
    END IF;
    
    -- Check minimum withdrawal amount
    IF NEW.amount_coins < 100000 THEN
        RAISE EXCEPTION 'Minimum withdrawal amount is 100,000 coins';
    END IF;
    
    -- Verify bank account belongs to user and is verified
    IF NOT EXISTS (
        SELECT 1 FROM bank_accounts 
        WHERE id = NEW.bank_account_id 
        AND user_id = NEW.user_id 
        AND is_verified = true 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Invalid or unverified bank account';
    END IF;
    
    -- Calculate Naira amount (100,000 coins = ₦10,000 = 1,000,000 kobo)
    NEW.amount_naira := (NEW.amount_coins / 100000) * 1000000; -- Convert to kobo
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal validation
DROP TRIGGER IF EXISTS validate_withdrawal_trigger ON withdrawals;
CREATE TRIGGER validate_withdrawal_trigger
    BEFORE INSERT ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION validate_withdrawal_request();

-- Create function to handle withdrawal status changes
CREATE OR REPLACE FUNCTION handle_withdrawal_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When withdrawal is approved, deduct coins and create transaction record
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
        -- Create withdrawal transaction record
        INSERT INTO coin_transactions (
            user_id, 
            amount, 
            transaction_type, 
            status, 
            description,
            metadata
        ) VALUES (
            NEW.user_id,
            -NEW.amount_coins, -- Negative amount for withdrawal
            'withdrawal',
            'completed',
            'Withdrawal to bank account',
            jsonb_build_object(
                'withdrawal_id', NEW.id,
                'bank_account_id', NEW.bank_account_id,
                'amount_naira', NEW.amount_naira
            )
        );
        
        NEW.processed_date := NOW();
    END IF;
    
    -- When withdrawal is rejected, no coin deduction
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        NEW.processed_date := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal status changes
DROP TRIGGER IF EXISTS withdrawal_status_change_trigger ON withdrawals;
CREATE TRIGGER withdrawal_status_change_trigger
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION handle_withdrawal_status_change();

-- Insert some sample transaction types for reference
INSERT INTO coin_transactions (user_id, amount, transaction_type, status, description, metadata)
SELECT 
    id,
    0,
    'system',
    'completed',
    'Database schema setup - sample transaction',
    '{"setup": true, "version": "1.0"}'
FROM users 
WHERE email = 'talktostevenson@gmail.com'
ON CONFLICT DO NOTHING;

-- Create view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_transaction_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    transaction_type,
    status,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM coin_transactions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), transaction_type, status
ORDER BY date DESC;

-- Create view for admin withdrawal stats
CREATE OR REPLACE VIEW admin_withdrawal_stats AS
SELECT 
    DATE_TRUNC('day', request_date) as date,
    status,
    COUNT(*) as withdrawal_count,
    SUM(amount_coins) as total_coins,
    SUM(amount_naira) as total_naira,
    AVG(amount_coins) as average_coins
FROM withdrawals
WHERE request_date >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', request_date), status
ORDER BY date DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON coin_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON withdrawals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_accounts TO authenticated;
GRANT SELECT ON admin_transaction_stats TO authenticated;
GRANT SELECT ON admin_withdrawal_stats TO authenticated;

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_type_status ON coin_transactions(user_id, transaction_type, status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_verified ON bank_accounts(user_id, is_verified, is_active);

COMMENT ON TABLE coin_transactions IS 'Stores all coin-related transactions including purchases, withdrawals, and system transactions';
COMMENT ON TABLE withdrawals IS 'Manages withdrawal requests from users with admin approval workflow';
COMMENT ON TABLE bank_accounts IS 'Stores verified bank account information for withdrawals';

COMMENT ON COLUMN coin_transactions.paystack_reference IS 'Paystack transaction reference for purchase verification';
COMMENT ON COLUMN coin_transactions.metadata IS 'Additional transaction data in JSON format';
COMMENT ON COLUMN withdrawals.amount_coins IS 'Amount in coins to withdraw (minimum 100,000)';
COMMENT ON COLUMN withdrawals.amount_naira IS 'Equivalent amount in Naira kobo (100,000 coins = 1,000,000 kobo = ₦10,000)';
COMMENT ON COLUMN withdrawals.exchange_rate IS 'Coins to Naira exchange rate at time of request';
