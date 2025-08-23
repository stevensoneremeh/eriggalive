-- Ticketing System V1 - Additive Migration
-- This migration adds new tables for the ticketing and membership system
-- All existing tables are preserved

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Settings table for system configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced events table (new version alongside existing events table)
CREATE TABLE IF NOT EXISTS events_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    venue TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    cover_image_url TEXT,
    ticket_price_ngn INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for events_v2
CREATE INDEX IF NOT EXISTS idx_events_v2_status ON events_v2(status);
CREATE INDEX IF NOT EXISTS idx_events_v2_starts_at ON events_v2(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_v2_slug ON events_v2(slug);

-- Payments table for all payment transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    context TEXT NOT NULL CHECK (context IN ('ticket', 'membership')),
    context_id UUID,
    provider TEXT NOT NULL CHECK (provider IN ('paystack', 'coin')),
    provider_ref TEXT UNIQUE,
    amount_ngn INTEGER NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_ref);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_context ON payments(context);

-- Tickets table for event tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events_v2(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'admitted', 'refunded', 'invalid')),
    qr_token_hash TEXT UNIQUE NOT NULL,
    qr_expires_at TIMESTAMPTZ,
    admitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tickets
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_token_hash ON tickets(qr_token_hash);

-- Membership tiers table
CREATE TABLE IF NOT EXISTS membership_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL CHECK (code IN ('FREE', 'PRO', 'ENT')),
    name TEXT NOT NULL,
    description TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    plan_codes JSONB DEFAULT '{}',
    min_amount_ngn INTEGER,
    billing_cycles JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_code TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    total_months_purchased INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for memberships
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_code TEXT NOT NULL,
    interval TEXT NOT NULL CHECK (interval IN ('monthly', 'quarterly', 'yearly', 'annual_custom')),
    months_purchased INTEGER NOT NULL,
    amount_paid_ngn INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Wallets table (enhanced version of existing coin system)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_coins BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet ledger for transaction history
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount_coins BIGINT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('membership_bonus', 'ticket_purchase', 'admin_adjustment', 'refund')),
    ref_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for wallet_ledger
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_id ON wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON wallet_ledger(created_at);

-- Scan logs for ticket check-ins
CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scan_result TEXT NOT NULL CHECK (scan_result IN ('admitted', 'duplicate', 'invalid')),
    device_fingerprint TEXT,
    location_hint TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for scan_logs
CREATE INDEX IF NOT EXISTS idx_scan_logs_ticket_id ON scan_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at);

-- Enhanced admin users table (if not using existing admin_users)
CREATE TABLE IF NOT EXISTS admin_users_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('scanner', 'manager', 'superadmin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index for admin_users_v2
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_v2_user_id ON admin_users_v2(user_id);

-- Insert default membership tiers
INSERT INTO membership_tiers (code, name, description, is_paid, billing_cycles) VALUES
('FREE', 'Free', 'Basic access to the platform', FALSE, '{}'),
('PRO', 'Pro', 'Enhanced features and content access', TRUE, '{"monthly": true, "quarterly": true, "yearly": true}'),
('ENT', 'Enterprise', 'Premium annual membership with custom pricing', TRUE, '{"annual_custom": true}')
ON CONFLICT (code) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value_json) VALUES
('current_event_id', 'null'),
('pro_monthly_price_ngn', '10000'),
('pro_quarterly_price_ngn', '30000'),
('pro_yearly_price_ngn', '120000'),
('enterprise_min_ngn', '100000'),
('feature_flags', '{"tickets_v1": true, "membership_v1": true, "wallet_v1": true, "scanner_pwa_v1": true}')
ON CONFLICT (key) DO NOTHING;

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users_v2 ENABLE ROW LEVEL SECURITY;

-- Settings policies (read-only for authenticated users)
CREATE POLICY "Settings are readable by authenticated users" ON settings
    FOR SELECT TO authenticated USING (true);

-- Events policies (readable by all, writable by service role only)
CREATE POLICY "Events are readable by everyone" ON events_v2
    FOR SELECT TO anon, authenticated USING (true);

-- Payments policies (users can read their own)
CREATE POLICY "Users can read their own payments" ON payments
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Tickets policies (users can read their own)
CREATE POLICY "Users can read their own tickets" ON tickets
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Membership tiers policies (readable by all)
CREATE POLICY "Membership tiers are readable by everyone" ON membership_tiers
    FOR SELECT TO anon, authenticated USING (true);

-- Memberships policies (users can read their own)
CREATE POLICY "Users can read their own memberships" ON memberships
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Subscriptions policies (users can read their own)
CREATE POLICY "Users can read their own subscriptions" ON subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Wallets policies (users can read their own)
CREATE POLICY "Users can read their own wallet" ON wallets
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Wallet ledger policies (users can read their own)
CREATE POLICY "Users can read their own wallet ledger" ON wallet_ledger
    FOR SELECT TO authenticated USING (
        wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
    );

-- Scan logs policies (admin only)
CREATE POLICY "Only admins can read scan logs" ON scan_logs
    FOR SELECT TO authenticated USING (
        auth.uid() IN (SELECT user_id FROM admin_users_v2 WHERE is_active = true)
    );

-- Admin users policies (admin only)
CREATE POLICY "Only admins can read admin users" ON admin_users_v2
    FOR SELECT TO authenticated USING (
        auth.uid() IN (SELECT user_id FROM admin_users_v2 WHERE is_active = true)
    );

-- Functions for wallet operations
CREATE OR REPLACE FUNCTION credit_wallet(p_user_id UUID, p_amount BIGINT, p_reason TEXT, p_ref_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Get or create wallet
    INSERT INTO wallets (user_id, balance_coins)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
    
    -- Update balance
    UPDATE wallets 
    SET balance_coins = balance_coins + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Add ledger entry
    INSERT INTO wallet_ledger (wallet_id, type, amount_coins, reason, ref_id)
    VALUES (v_wallet_id, 'credit', p_amount, p_reason, p_ref_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION debit_wallet(p_user_id UUID, p_amount BIGINT, p_reason TEXT, p_ref_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_id UUID;
    v_current_balance BIGINT;
BEGIN
    -- Get wallet
    SELECT id, balance_coins INTO v_wallet_id, v_current_balance 
    FROM wallets WHERE user_id = p_user_id;
    
    -- Check if wallet exists and has sufficient balance
    IF v_wallet_id IS NULL OR v_current_balance < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Update balance
    UPDATE wallets 
    SET balance_coins = balance_coins - p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Add ledger entry
    INSERT INTO wallet_ledger (wallet_id, type, amount_coins, reason, ref_id)
    VALUES (v_wallet_id, 'debit', p_amount, p_reason, p_ref_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining event capacity
CREATE OR REPLACE FUNCTION get_event_capacity_remaining(p_event_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_capacity INTEGER;
    v_sold INTEGER;
BEGIN
    SELECT capacity INTO v_capacity FROM events_v2 WHERE id = p_event_id;
    
    SELECT COUNT(*) INTO v_sold 
    FROM tickets 
    WHERE event_id = p_event_id AND status IN ('unused', 'admitted');
    
    RETURN COALESCE(v_capacity, 0) - COALESCE(v_sold, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_v2_updated_at BEFORE UPDATE ON events_v2
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_tiers_updated_at BEFORE UPDATE ON membership_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_v2_updated_at BEFORE UPDATE ON admin_users_v2
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
