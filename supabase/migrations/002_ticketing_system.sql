-- Ticketing and Membership System Migration
-- This migration adds comprehensive ticketing, membership, and event management functionality

-- Events table for managing concerts, shows, and other events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  venue VARCHAR(255) NOT NULL,
  address TEXT,
  ticket_price BIGINT NOT NULL, -- in kobo (NGN cents)
  coin_price INTEGER, -- optional coin price
  max_capacity INTEGER NOT NULL,
  tickets_sold INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table for individual ticket purchases
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  qr_code TEXT NOT NULL, -- encrypted QR code data
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('paystack', 'coins')),
  payment_reference VARCHAR(255),
  amount_paid BIGINT NOT NULL, -- amount in kobo or coins
  status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'refunded', 'cancelled')),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  scanned_by UUID REFERENCES auth.users(id), -- admin who scanned the ticket
  UNIQUE(user_id, event_id) -- one ticket per user per event
);

-- Membership tiers table
CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  price_monthly BIGINT NOT NULL, -- in kobo
  price_yearly BIGINT, -- optional yearly pricing
  features JSONB NOT NULL DEFAULT '[]',
  max_tickets_per_event INTEGER DEFAULT 1,
  early_access_hours INTEGER DEFAULT 0, -- hours before general sale
  discount_percentage INTEGER DEFAULT 0, -- discount on tickets
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User memberships table
CREATE TABLE IF NOT EXISTS public.user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.membership_tiers(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  payment_reference VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket payments table for tracking all payment attempts
CREATE TABLE IF NOT EXISTS public.ticket_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('paystack', 'coins')),
  amount BIGINT NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  paystack_reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event check-ins table for tracking attendance
CREATE TABLE IF NOT EXISTS public.event_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_by UUID REFERENCES auth.users(id), -- admin who checked in
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  location_data JSONB, -- optional GPS/location data
  device_info JSONB, -- scanner device information
  UNIQUE(ticket_id) -- prevent duplicate check-ins
);

-- Wallet transactions extension for ticket purchases
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount BIGINT NOT NULL, -- positive for credits, negative for debits
  balance_after BIGINT NOT NULL,
  reference VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON public.tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON public.user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_ticket_payments_paystack_reference ON public.ticket_payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Events: Public read, admin write
CREATE POLICY "events_public_read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_admin_write" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tickets: Users can see their own tickets, admins can see all
CREATE POLICY "tickets_user_read" ON public.tickets FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "tickets_user_insert" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Membership tiers: Public read, admin write
CREATE POLICY "membership_tiers_public_read" ON public.membership_tiers FOR SELECT USING (is_active = true);
CREATE POLICY "membership_tiers_admin_write" ON public.membership_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User memberships: Users can see their own, admins can see all
CREATE POLICY "user_memberships_user_read" ON public.user_memberships FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "user_memberships_user_insert" ON public.user_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ticket payments: Users can see their own, admins can see all
CREATE POLICY "ticket_payments_user_read" ON public.ticket_payments FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Event check-ins: Admins only
CREATE POLICY "event_checkins_admin_only" ON public.event_checkins FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Wallet transactions: Users can see their own
CREATE POLICY "wallet_transactions_user_read" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Functions

-- Generate unique ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  ticket_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    ticket_num := 'TKT' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT COUNT(*) INTO exists_check FROM public.tickets WHERE ticket_number = ticket_num;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Purchase ticket with coins
CREATE OR REPLACE FUNCTION purchase_ticket_with_coins(
  p_event_id UUID,
  p_user_id UUID,
  p_coin_amount INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_ticket_id UUID;
  v_current_balance BIGINT;
  v_event_coin_price INTEGER;
  v_tickets_sold INTEGER;
  v_max_capacity INTEGER;
BEGIN
  -- Check event exists and get coin price
  SELECT coin_price, tickets_sold, max_capacity 
  INTO v_event_coin_price, v_tickets_sold, v_max_capacity
  FROM public.events 
  WHERE id = p_event_id AND status = 'upcoming';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or not available for purchase';
  END IF;
  
  -- Check capacity
  IF v_tickets_sold >= v_max_capacity THEN
    RAISE EXCEPTION 'Event is sold out';
  END IF;
  
  -- Check coin price matches
  IF v_event_coin_price IS NULL OR v_event_coin_price != p_coin_amount THEN
    RAISE EXCEPTION 'Invalid coin amount';
  END IF;
  
  -- Check user balance
  SELECT balance INTO v_current_balance FROM public.wallet WHERE user_id = p_user_id;
  IF v_current_balance < p_coin_amount THEN
    RAISE EXCEPTION 'Insufficient coin balance';
  END IF;
  
  -- Deduct coins
  UPDATE public.wallet 
  SET balance = balance - p_coin_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create wallet transaction record
  INSERT INTO public.wallet_transactions (user_id, transaction_type, amount, balance_after, description)
  VALUES (p_user_id, 'debit', -p_coin_amount, v_current_balance - p_coin_amount, 'Ticket purchase');
  
  -- Create ticket
  INSERT INTO public.tickets (event_id, user_id, ticket_number, qr_code, payment_method, amount_paid)
  VALUES (
    p_event_id, 
    p_user_id, 
    generate_ticket_number(),
    encode(digest(p_event_id::text || p_user_id::text || extract(epoch from now())::text, 'sha256'), 'hex'),
    'coins',
    p_coin_amount
  )
  RETURNING id INTO v_ticket_id;
  
  -- Update event tickets sold
  UPDATE public.events SET tickets_sold = tickets_sold + 1 WHERE id = p_event_id;
  
  RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Validate and use ticket
CREATE OR REPLACE FUNCTION validate_and_use_ticket(
  p_ticket_id UUID,
  p_scanned_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_ticket_status VARCHAR(20);
  v_event_id UUID;
  v_user_id UUID;
BEGIN
  -- Get ticket info
  SELECT status, event_id, user_id 
  INTO v_ticket_status, v_event_id, v_user_id
  FROM public.tickets 
  WHERE id = p_ticket_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  
  IF v_ticket_status != 'valid' THEN
    RAISE EXCEPTION 'Ticket is not valid (status: %)', v_ticket_status;
  END IF;
  
  -- Mark ticket as used
  UPDATE public.tickets 
  SET status = 'used', used_at = NOW(), scanned_by = p_scanned_by
  WHERE id = p_ticket_id;
  
  -- Create check-in record
  INSERT INTO public.event_checkins (event_id, ticket_id, user_id, checked_in_by)
  VALUES (v_event_id, p_ticket_id, v_user_id, p_scanned_by);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_tiers_updated_at BEFORE UPDATE ON public.membership_tiers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at BEFORE UPDATE ON public.user_memberships 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_payments_updated_at BEFORE UPDATE ON public.ticket_payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data for membership tiers
INSERT INTO public.membership_tiers (name, slug, price_monthly, price_yearly, features, max_tickets_per_event, early_access_hours, discount_percentage) VALUES
('Free', 'free', 0, 0, '["Access to community", "Basic radio features"]', 1, 0, 0),
('Pro', 'pro', 500000, 5000000, '["Priority support", "Exclusive content", "Early ticket access", "10% discount on tickets"]', 2, 24, 10),
('Enterprise', 'enterprise', 2000000, 20000000, '["VIP support", "Backstage access", "Meet & greet opportunities", "20% discount on tickets", "Exclusive merchandise"]', 5, 48, 20)
ON CONFLICT (slug) DO NOTHING;

-- Create views for analytics
CREATE OR REPLACE VIEW ticket_sales_summary AS
SELECT 
  e.id as event_id,
  e.title as event_title,
  e.event_date,
  e.max_capacity,
  e.tickets_sold,
  COUNT(t.id) as tickets_purchased,
  SUM(CASE WHEN t.payment_method = 'paystack' THEN t.amount_paid ELSE 0 END) as revenue_ngn,
  SUM(CASE WHEN t.payment_method = 'coins' THEN t.amount_paid ELSE 0 END) as revenue_coins,
  COUNT(CASE WHEN t.status = 'used' THEN 1 END) as tickets_used
FROM public.events e
LEFT JOIN public.tickets t ON e.id = t.event_id
GROUP BY e.id, e.title, e.event_date, e.max_capacity, e.tickets_sold;

-- Notification functions for real-time updates
CREATE OR REPLACE FUNCTION notify_ticket_purchase()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('ticket_purchased', json_build_object(
    'ticket_id', NEW.id,
    'event_id', NEW.event_id,
    'user_id', NEW.user_id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_purchase_notification
  AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION notify_ticket_purchase();
