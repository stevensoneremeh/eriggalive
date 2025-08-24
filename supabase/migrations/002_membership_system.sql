-- Membership System Database Schema
-- This migration adds tiered membership functionality with payment integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create membership_tiers table
CREATE TABLE IF NOT EXISTS membership_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL CHECK (code IN ('FREE', 'PRO', 'ENT')),
    name TEXT NOT NULL,
    description TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    billing_options JSONB DEFAULT '[]'::jsonb,
    badge_label TEXT NOT NULL,
    badge_color TEXT NOT NULL,
    dashboard_theme TEXT DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_code TEXT NOT NULL REFERENCES membership_tiers(code),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    months_purchased INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- One active membership per user
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance_coins INTEGER DEFAULT 0 CHECK (balance_coins >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_ledger table for transaction history
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount_coins INTEGER NOT NULL CHECK (amount_coins > 0),
    reason TEXT NOT NULL,
    ref_id UUID, -- Reference to payment, purchase, etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_code TEXT NOT NULL REFERENCES membership_tiers(code),
    interval TEXT CHECK (interval IN ('monthly', 'quarterly', 'annually')),
    amount_ngn INTEGER NOT NULL CHECK (amount_ngn > 0),
    provider TEXT DEFAULT 'paystack',
    provider_ref TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tier_code ON memberships(tier_code);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_id ON wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON wallet_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_ref);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable Row Level Security
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_tiers (public read)
CREATE POLICY "membership_tiers_select_all" ON membership_tiers
    FOR SELECT USING (true);

-- RLS Policies for memberships
CREATE POLICY "memberships_select_own" ON memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "memberships_insert_own" ON memberships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "memberships_update_own" ON memberships
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for wallets
CREATE POLICY "wallets_select_own" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallets_insert_own" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wallets_update_own" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for wallet_ledger
CREATE POLICY "wallet_ledger_select_own" ON wallet_ledger
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wallets 
            WHERE wallets.id = wallet_ledger.wallet_id 
            AND wallets.user_id = auth.uid()
        )
    );

CREATE POLICY "wallet_ledger_insert_own" ON wallet_ledger
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM wallets 
            WHERE wallets.id = wallet_ledger.wallet_id 
            AND wallets.user_id = auth.uid()
        )
    );

-- RLS Policies for payments
CREATE POLICY "payments_select_own" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payments_insert_own" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments_update_own" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Functions for membership management
CREATE OR REPLACE FUNCTION get_user_membership(user_uuid UUID)
RETURNS TABLE (
    tier_code TEXT,
    tier_name TEXT,
    badge_label TEXT,
    badge_color TEXT,
    dashboard_theme TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mt.code,
        mt.name,
        mt.badge_label,
        mt.badge_color,
        mt.dashboard_theme,
        m.expires_at,
        (m.status = 'active' AND (m.expires_at IS NULL OR m.expires_at > NOW())) as is_active
    FROM memberships m
    JOIN membership_tiers mt ON m.tier_code = mt.code
    WHERE m.user_id = user_uuid
    ORDER BY m.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to credit wallet with coins
CREATE OR REPLACE FUNCTION credit_wallet_coins(
    user_uuid UUID,
    coins_amount INTEGER,
    credit_reason TEXT,
    reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    wallet_record wallets%ROWTYPE;
BEGIN
    -- Get or create wallet
    INSERT INTO wallets (user_id, balance_coins)
    VALUES (user_uuid, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update wallet balance
    UPDATE wallets 
    SET 
        balance_coins = balance_coins + coins_amount,
        updated_at = NOW()
    WHERE user_id = user_uuid
    RETURNING * INTO wallet_record;
    
    -- Log transaction
    INSERT INTO wallet_ledger (wallet_id, type, amount_coins, reason, ref_id)
    VALUES (wallet_record.id, 'credit', coins_amount, credit_reason, reference_id);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process membership purchase
CREATE OR REPLACE FUNCTION process_membership_purchase(
    user_uuid UUID,
    tier_code_param TEXT,
    months_count INTEGER,
    payment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    coins_to_credit INTEGER;
BEGIN
    -- Calculate coins (1000 per month for paid tiers)
    IF tier_code_param IN ('PRO', 'ENT') THEN
        coins_to_credit := months_count * 1000;
    ELSE
        coins_to_credit := 0;
    END IF;
    
    -- Create or update membership
    INSERT INTO memberships (user_id, tier_code, months_purchased, expires_at)
    VALUES (
        user_uuid, 
        tier_code_param, 
        months_count,
        CASE 
            WHEN tier_code_param = 'FREE' THEN NULL
            ELSE NOW() + (months_count || ' months')::INTERVAL
        END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        tier_code = EXCLUDED.tier_code,
        months_purchased = EXCLUDED.months_purchased,
        expires_at = EXCLUDED.expires_at,
        status = 'active',
        updated_at = NOW();
    
    -- Credit coins if applicable
    IF coins_to_credit > 0 THEN
        PERFORM credit_wallet_coins(user_uuid, coins_to_credit, 'membership_bonus', payment_id);
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed membership tiers data
INSERT INTO membership_tiers (code, name, description, is_paid, billing_options, badge_label, badge_color, dashboard_theme) VALUES
('FREE', 'Free Tier', 'Basic access to Erigga content and community', FALSE, '[]'::jsonb, 'ECor Erigga Citizen', '#6B7280', 'default'),
('PRO', 'Pro Tier', 'Enhanced access with exclusive content and coin rewards', TRUE, '["monthly", "quarterly", "annually"]'::jsonb, 'Erigga Indigen', '#4B9CD3', 'default'),
('ENT', 'Enterprise Tier', 'Premium access with custom dashboard and maximum benefits', TRUE, '["annually"]'::jsonb, 'E', '#FFD700', 'enterprise')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_paid = EXCLUDED.is_paid,
    billing_options = EXCLUDED.billing_options,
    badge_label = EXCLUDED.badge_label,
    badge_color = EXCLUDED.badge_color,
    dashboard_theme = EXCLUDED.dashboard_theme,
    updated_at = NOW();

-- Create trigger to automatically create wallet for new users
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance_coins)
    VALUES (NEW.id, 0);
    
    -- Create default free membership
    INSERT INTO memberships (user_id, tier_code, status)
    VALUES (NEW.id, 'FREE', 'active');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Update existing users to have wallets and free memberships (if they don't already)
DO $$
BEGIN
    -- Create wallets for existing users
    INSERT INTO wallets (user_id, balance_coins)
    SELECT id, 0 FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM wallets)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create free memberships for existing users
    INSERT INTO memberships (user_id, tier_code, status)
    SELECT id, 'FREE', 'active' FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM memberships)
    ON CONFLICT (user_id) DO NOTHING;
END $$;
