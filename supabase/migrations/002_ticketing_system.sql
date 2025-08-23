-- Adding comprehensive ticketing and membership system tables
-- This migration adds all required tables for the ticketing system while preserving existing data

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

-- Enhanced events table (modify existing if needed)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT max_capacity;

-- Create index on events
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(event_date);

-- Membership tiers table
CREATE TABLE IF NOT EXISTS membership_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL CHECK (code IN ('FREE', 'PRO', 'ENT')),
    name TEXT NOT NULL,
    description TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    plan_codes JSONB DEFAULT '{}',
    min_amount_ngn INTEGER,
    billing_cycles JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table (comprehensive payment tracking)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    context TEXT NOT NULL CHECK (context IN ('ticket', 'membership')),
    context_id UUID,
    provider TEXT NOT NULL CHECK (provider IN ('paystack', 'coin')),
    provider_ref TEXT UNIQUE,
    amount_ngn INTEGER NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on payments
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_ref);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_context ON payments(context);

-- Tickets table (new secure ticket system)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'admitted', 'refunded', 'invalid')),
    qr_token_hash TEXT UNIQUE NOT NULL,
    qr_expires_at TIMESTAMPTZ,
    admitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on tickets
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_token_hash ON tickets(qr_token_hash);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_code TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    total_months_purchased INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on memberships
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

-- Subscriptions table (different from existing user_subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_code TEXT NOT NULL,
    interval TEXT NOT NULL CHECK (interval IN ('monthly', 'quarterly', 'yearly', 'annual_custom')),
    months_purchased INTEGER NOT NULL,
    amount_paid_ngn INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Wallets table (enhanced wallet system)
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

-- Create indexes on wallet_ledger
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_id ON wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON wallet_ledger(created_at);

-- Scan logs for ticket verification audit
CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scan_result TEXT NOT NULL CHECK (scan_result IN ('admitted', 'duplicate', 'invalid')),
    device_fingerprint TEXT,
    location_hint TEXT,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on scan_logs
CREATE INDEX IF NOT EXISTS idx_scan_logs_ticket_id ON scan_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at);

-- Seed membership tiers
INSERT INTO membership_tiers (code, name, description, is_paid, billing_cycles, min_amount_ngn) VALUES
('FREE', 'Free', 'Basic access to EriggaLive', FALSE, '{}', NULL),
('PRO', 'Pro', 'Enhanced features and exclusive content', TRUE, '{"monthly": true, "quarterly": true, "yearly": true}', NULL),
('ENT', 'Enterprise', 'Premium annual membership with custom pricing', TRUE, '{"annual_custom": true}', 100000)
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
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Settings policies (public read, admin write)
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);
CREATE POLICY "Settings are writable by service role" ON settings FOR ALL USING (auth.role() = 'service_role');

-- Membership tiers policies (public read)
CREATE POLICY "Membership tiers are viewable by everyone" ON membership_tiers FOR SELECT USING (true);
CREATE POLICY "Membership tiers are writable by service role" ON membership_tiers FOR ALL USING (auth.role() = 'service_role');

-- Payments policies (users can view their own)
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all payments" ON payments FOR ALL USING (auth.role() = 'service_role');

-- Tickets policies (users can view their own)
CREATE POLICY "Users can view their own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all tickets" ON tickets FOR ALL USING (auth.role() = 'service_role');

-- Memberships policies (users can view their own)
CREATE POLICY "Users can view their own memberships" ON memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all memberships" ON memberships FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions policies (users can view their own)
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');

-- Wallets policies (users can view their own)
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all wallets" ON wallets FOR ALL USING (auth.role() = 'service_role');

-- Wallet ledger policies (users can view their own)
CREATE POLICY "Users can view their own wallet ledger" ON wallet_ledger 
FOR SELECT USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage all wallet ledger" ON wallet_ledger FOR ALL USING (auth.role() = 'service_role');

-- Scan logs policies (admin only)
CREATE POLICY "Scan logs are viewable by service role only" ON scan_logs FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all scan logs" ON scan_logs FOR ALL USING (auth.role() = 'service_role');

-- Functions for wallet operations
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet when user is created
CREATE TRIGGER create_wallet_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_user();

-- Function to update wallet balance atomically
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_user_id UUID,
    p_amount_coins BIGINT,
    p_type TEXT,
    p_reason TEXT,
    p_ref_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_id UUID;
    v_current_balance BIGINT;
BEGIN
    -- Get wallet and current balance
    SELECT id, balance_coins INTO v_wallet_id, v_current_balance
    FROM wallets WHERE user_id = p_user_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
    END IF;
    
    -- Check for sufficient balance on debit
    IF p_type = 'debit' AND v_current_balance < p_amount_coins THEN
        RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', v_current_balance, p_amount_coins;
    END IF;
    
    -- Update wallet balance
    IF p_type = 'credit' THEN
        UPDATE wallets SET 
            balance_coins = balance_coins + p_amount_coins,
            updated_at = NOW()
        WHERE id = v_wallet_id;
    ELSE
        UPDATE wallets SET 
            balance_coins = balance_coins - p_amount_coins,
            updated_at = NOW()
        WHERE id = v_wallet_id;
    END IF;
    
    -- Insert ledger entry
    INSERT INTO wallet_ledger (wallet_id, type, amount_coins, reason, ref_id)
    VALUES (v_wallet_id, p_type, p_amount_coins, p_reason, p_ref_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate secure QR token hash
CREATE OR REPLACE FUNCTION generate_qr_token_hash(token TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(hmac(token, current_setting('app.qr_signing_secret', true), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_membership_tiers_updated_at BEFORE UPDATE ON membership_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
