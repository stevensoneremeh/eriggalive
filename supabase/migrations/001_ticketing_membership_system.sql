-- EriggaLive Ticketing and Membership System Database Schema
-- This migration creates all tables, functions, and policies for the complete system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE USER SYSTEM
-- =============================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'pro', 'enterprise')),
    membership_expires_at TIMESTAMP WITH TIME ZONE,
    coins_balance INTEGER DEFAULT 0,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id),
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EVENTS AND TICKETING
-- =============================================

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('concert', 'meet_greet', 'exclusive', 'virtual')),
    venue TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Nigeria',
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    doors_open TIMESTAMP WITH TIME ZONE,
    event_end TIMESTAMP WITH TIME ZONE,
    max_capacity INTEGER,
    current_attendance INTEGER DEFAULT 0,
    ticket_price_naira DECIMAL(10,2),
    ticket_price_coins INTEGER,
    early_bird_price_naira DECIMAL(10,2),
    early_bird_price_coins INTEGER,
    early_bird_ends TIMESTAMP WITH TIME ZONE,
    vip_price_naira DECIMAL(10,2),
    vip_price_coins INTEGER,
    vip_capacity INTEGER,
    current_vip_sold INTEGER DEFAULT 0,
    image_url TEXT,
    banner_url TEXT,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'live', 'completed', 'cancelled')),
    requires_membership TEXT CHECK (requires_membership IN ('free', 'pro', 'enterprise')),
    is_featured BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('regular', 'vip', 'early_bird')),
    ticket_number TEXT UNIQUE NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    qr_token TEXT UNIQUE NOT NULL, -- Encrypted token for validation
    price_paid_naira DECIMAL(10,2),
    price_paid_coins INTEGER,
    payment_method TEXT CHECK (payment_method IN ('paystack', 'coins', 'free')),
    payment_reference TEXT,
    status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    checked_in_by UUID REFERENCES public.profiles(id),
    check_in_location TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PAYMENT SYSTEM
-- =============================================

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'refund', 'withdrawal', 'deposit', 'transfer')),
    category TEXT CHECK (category IN ('ticket', 'membership', 'coins', 'merchandise', 'other')),
    amount_naira DECIMAL(10,2),
    amount_coins INTEGER,
    payment_method TEXT CHECK (payment_method IN ('paystack', 'coins', 'wallet', 'free')),
    paystack_reference TEXT,
    paystack_transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    reference_id UUID, -- Can reference tickets, events, etc.
    reference_type TEXT, -- 'ticket', 'event', 'membership', etc.
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount_naira DECIMAL(10,2) NOT NULL,
    amount_coins INTEGER,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
    admin_notes TEXT,
    processed_by UUID REFERENCES public.profiles(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    paystack_recipient_code TEXT,
    paystack_transfer_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MEMBERSHIP SYSTEM
-- =============================================

-- Membership benefits table
CREATE TABLE IF NOT EXISTS public.membership_benefits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
    benefit_key TEXT NOT NULL,
    benefit_value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Membership transactions
CREATE TABLE IF NOT EXISTS public.membership_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    from_tier TEXT CHECK (from_tier IN ('free', 'pro', 'enterprise')),
    to_tier TEXT NOT NULL CHECK (to_tier IN ('free', 'pro', 'enterprise')),
    duration_months INTEGER NOT NULL,
    amount_paid_naira DECIMAL(10,2),
    amount_paid_coins INTEGER,
    payment_method TEXT CHECK (payment_method IN ('paystack', 'coins')),
    payment_reference TEXT,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ADMIN AND SCANNING SYSTEM
-- =============================================

-- Admin scan logs
CREATE TABLE IF NOT EXISTS public.scan_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    scanned_by UUID REFERENCES public.profiles(id) NOT NULL,
    scan_result TEXT NOT NULL CHECK (scan_result IN ('valid', 'already_used', 'invalid', 'expired', 'wrong_event')),
    scan_location TEXT,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions log
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT, -- 'user', 'event', 'ticket', etc.
    target_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate unique ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number(event_id UUID)
RETURNS TEXT AS $$
DECLARE
    event_prefix TEXT;
    ticket_count INTEGER;
    ticket_number TEXT;
BEGIN
    -- Get event prefix (first 3 chars of title + year)
    SELECT UPPER(LEFT(REPLACE(title, ' ', ''), 3)) || EXTRACT(YEAR FROM event_date)::TEXT
    INTO event_prefix
    FROM events WHERE id = event_id;
    
    -- Get current ticket count for this event
    SELECT COUNT(*) + 1 INTO ticket_count
    FROM tickets WHERE tickets.event_id = generate_ticket_number.event_id;
    
    -- Generate ticket number
    ticket_number := event_prefix || '-' || LPAD(ticket_count::TEXT, 4, '0');
    
    RETURN ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate QR token
CREATE OR REPLACE FUNCTION generate_qr_token(ticket_id UUID, user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        hmac(
            ticket_id::TEXT || user_id::TEXT || extract(epoch from now())::TEXT,
            'erigga-live-secret-key',
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate QR token
CREATE OR REPLACE FUNCTION validate_qr_token(ticket_id UUID, token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    ticket_record RECORD;
    expected_token TEXT;
BEGIN
    -- Get ticket details
    SELECT t.*, p.id as user_id INTO ticket_record
    FROM tickets t
    JOIN profiles p ON t.user_id = p.id
    WHERE t.id = ticket_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if token matches
    RETURN ticket_record.qr_token = token;
END;
$$ LANGUAGE plpgsql;

-- Function to update user coins balance
CREATE OR REPLACE FUNCTION update_user_coins(user_id UUID, amount INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET coins_balance = coins_balance + amount,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to update user wallet balance
CREATE OR REPLACE FUNCTION update_user_wallet(user_id UUID, amount DECIMAL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET wallet_balance = wallet_balance + amount,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Events policies
CREATE POLICY "Anyone can view published events" ON events FOR SELECT USING (status != 'draft');
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Tickets policies
CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage withdrawals" ON withdrawals FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Membership benefits policies (public read)
CREATE POLICY "Anyone can view membership benefits" ON membership_benefits FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage membership benefits" ON membership_benefits FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Membership transactions policies
CREATE POLICY "Users can view own membership transactions" ON membership_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own membership transactions" ON membership_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all membership transactions" ON membership_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Scan logs policies (admin only)
CREATE POLICY "Admins can manage scan logs" ON scan_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Admin actions policies (admin only)
CREATE POLICY "Admins can manage admin actions" ON admin_actions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier ON profiles(membership_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);

-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_paystack_reference ON transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Withdrawals indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default membership benefits
INSERT INTO membership_benefits (tier, benefit_key, benefit_value, description) VALUES
('free', 'max_tickets_per_event', '2', 'Maximum 2 tickets per event'),
('free', 'early_access', 'false', 'No early access to ticket sales'),
('free', 'discount_percentage', '0', 'No discount on tickets'),
('free', 'priority_support', 'false', 'Standard support'),

('pro', 'max_tickets_per_event', '5', 'Maximum 5 tickets per event'),
('pro', 'early_access', 'true', 'Early access to ticket sales'),
('pro', 'discount_percentage', '10', '10% discount on all tickets'),
('pro', 'priority_support', 'true', 'Priority customer support'),
('pro', 'exclusive_events', 'true', 'Access to Pro-only events'),

('enterprise', 'max_tickets_per_event', '20', 'Maximum 20 tickets per event'),
('enterprise', 'early_access', 'true', 'Early access to ticket sales'),
('enterprise', 'discount_percentage', '20', '20% discount on all tickets'),
('enterprise', 'priority_support', 'true', 'Priority customer support'),
('enterprise', 'exclusive_events', 'true', 'Access to all exclusive events'),
('enterprise', 'vip_access', 'true', 'VIP access and perks'),
('enterprise', 'meet_greet', 'true', 'Meet & greet opportunities')
ON CONFLICT DO NOTHING;

-- Create a sample admin user function (to be called after user signup)
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET is_admin = true 
    WHERE email = user_email;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMIT;
