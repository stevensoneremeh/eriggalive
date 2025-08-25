-- Withdrawal and Bank Account System Migration
-- Creates tables for coin withdrawals, bank verification, and admin notifications

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Nigerian Banks Table (including digital banks)
CREATE TABLE IF NOT EXISTS nigerian_banks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bank_name TEXT NOT NULL,
    bank_code TEXT UNIQUE NOT NULL,
    bank_type TEXT DEFAULT 'traditional' CHECK (bank_type IN ('traditional', 'digital', 'fintech')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Accounts Table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL,
    bank_code TEXT NOT NULL REFERENCES nigerian_banks(bank_code),
    account_name TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_reference TEXT,
    verification_attempts INTEGER DEFAULT 0,
    last_verification_attempt TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, account_number, bank_code)
);

-- Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE RESTRICT,
    amount_coins INTEGER NOT NULL CHECK (amount_coins >= 100000), -- Minimum 100,000 coins
    amount_naira DECIMAL(15,2) NOT NULL,
    exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0, -- Coins to Naira rate
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    reference_code TEXT UNIQUE NOT NULL DEFAULT 'WD-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || SUBSTRING(uuid_generate_v4()::TEXT, 1, 8),
    paystack_transfer_code TEXT,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('withdrawal_request', 'bank_verification', 'system_alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- Can reference withdrawal_id, bank_account_id, etc.
    is_read BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    read_by UUID REFERENCES auth.users(id)
);

-- Withdrawal History/Audit Table
CREATE TABLE IF NOT EXISTS withdrawal_audit (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    withdrawal_id UUID REFERENCES withdrawals(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Nigerian Banks Data
INSERT INTO nigerian_banks (bank_name, bank_code, bank_type) VALUES
-- Traditional Banks
('Access Bank', '044', 'traditional'),
('Citibank Nigeria', '023', 'traditional'),
('Ecobank Nigeria', '050', 'traditional'),
('Fidelity Bank', '070', 'traditional'),
('First Bank of Nigeria', '011', 'traditional'),
('First City Monument Bank', '214', 'traditional'),
('Guaranty Trust Bank', '058', 'traditional'),
('Heritage Bank', '030', 'traditional'),
('Keystone Bank', '082', 'traditional'),
('Polaris Bank', '076', 'traditional'),
('Providus Bank', '101', 'traditional'),
('Stanbic IBTC Bank', '221', 'traditional'),
('Standard Chartered Bank', '068', 'traditional'),
('Sterling Bank', '232', 'traditional'),
('Union Bank of Nigeria', '032', 'traditional'),
('United Bank For Africa', '033', 'traditional'),
('Unity Bank', '215', 'traditional'),
('Wema Bank', '035', 'traditional'),
('Zenith Bank', '057', 'traditional'),

-- Digital/Fintech Banks
('Opay', '999992', 'fintech'),
('PalmPay', '999991', 'fintech'),
('Kuda Bank', '50211', 'digital'),
('VFD Microfinance Bank', '566', 'digital'),
('Rubies MFB', '125', 'digital'),
('Sparkle Microfinance Bank', '51310', 'digital'),
('Carbon', '565', 'fintech'),
('FairMoney Microfinance Bank', '51318', 'digital'),
('Mint MFB', '50515', 'digital'),
('GoMoney', '100022', 'fintech'),
('Eyowo', '50126', 'fintech')
ON CONFLICT (bank_code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_verified ON bank_accounts(is_verified);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_notifications(is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_withdrawal_id ON withdrawal_audit(withdrawal_id);

-- Enable Row Level Security
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_accounts
CREATE POLICY "Users can view own bank accounts" ON bank_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts" ON bank_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" ON bank_accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies (assuming admin role exists)
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%@eriggalive.com')
        )
    );

CREATE POLICY "Admins can update withdrawals" ON withdrawals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%@eriggalive.com')
        )
    );

-- RLS Policies for admin_notifications
CREATE POLICY "Admins can view notifications" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%@eriggalive.com')
        )
    );

-- Functions for withdrawal workflow
CREATE OR REPLACE FUNCTION create_withdrawal_request(
    p_user_id UUID,
    p_bank_account_id UUID,
    p_amount_coins INTEGER,
    p_exchange_rate DECIMAL DEFAULT 1.0
) RETURNS UUID AS $$
DECLARE
    v_withdrawal_id UUID;
    v_amount_naira DECIMAL;
    v_current_balance INTEGER;
BEGIN
    -- Check user's coin balance
    SELECT COALESCE(coins, 0) INTO v_current_balance
    FROM profiles WHERE id = p_user_id;
    
    IF v_current_balance < p_amount_coins THEN
        RAISE EXCEPTION 'Insufficient coin balance';
    END IF;
    
    -- Calculate naira amount
    v_amount_naira := p_amount_coins * p_exchange_rate;
    
    -- Create withdrawal request
    INSERT INTO withdrawals (user_id, bank_account_id, amount_coins, amount_naira, exchange_rate)
    VALUES (p_user_id, p_bank_account_id, p_amount_coins, v_amount_naira, p_exchange_rate)
    RETURNING id INTO v_withdrawal_id;
    
    -- Deduct coins from user balance
    UPDATE profiles 
    SET coins = coins - p_amount_coins,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create admin notification
    INSERT INTO admin_notifications (type, title, message, related_id)
    VALUES (
        'withdrawal_request',
        'New Withdrawal Request',
        'User has requested withdrawal of ' || p_amount_coins || ' coins (₦' || v_amount_naira || ')',
        v_withdrawal_id
    );
    
    -- Create audit record
    INSERT INTO withdrawal_audit (withdrawal_id, old_status, new_status, changed_by, change_reason)
    VALUES (v_withdrawal_id, NULL, 'pending', p_user_id, 'Withdrawal request created');
    
    RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process withdrawal (approve/reject)
CREATE OR REPLACE FUNCTION process_withdrawal(
    p_withdrawal_id UUID,
    p_admin_id UUID,
    p_status TEXT,
    p_admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_withdrawal withdrawals%ROWTYPE;
    v_old_status TEXT;
BEGIN
    -- Get current withdrawal
    SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id;
    v_old_status := v_withdrawal.status;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal not found';
    END IF;
    
    -- Update withdrawal status
    UPDATE withdrawals 
    SET status = p_status,
        admin_notes = p_admin_notes,
        processed_by = p_admin_id,
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;
    
    -- If rejected, refund coins to user
    IF p_status = 'rejected' THEN
        UPDATE profiles 
        SET coins = coins + v_withdrawal.amount_coins,
            updated_at = NOW()
        WHERE id = v_withdrawal.user_id;
    END IF;
    
    -- Create audit record
    INSERT INTO withdrawal_audit (withdrawal_id, old_status, new_status, changed_by, change_reason)
    VALUES (p_withdrawal_id, v_old_status, p_status, p_admin_id, p_admin_notes);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
