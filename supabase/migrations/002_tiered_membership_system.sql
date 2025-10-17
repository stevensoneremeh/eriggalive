-- Tiered Membership System Migration
-- This migration adds the new membership tier system without affecting existing data

-- Create membership_tiers table
CREATE TABLE IF NOT EXISTS membership_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_paid BOOLEAN DEFAULT false,
  billing_options JSONB DEFAULT '[]'::jsonb,
  badge_label TEXT NOT NULL,
  badge_color TEXT NOT NULL,
  dashboard_theme TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_code TEXT REFERENCES membership_tiers(code) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  months_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tier_code)
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance_coins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_ledger table
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount_coins INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_code TEXT REFERENCES membership_tiers(code),
  interval TEXT CHECK (interval IN ('monthly', 'quarterly', 'annually')),
  amount_ngn INTEGER NOT NULL,
  provider TEXT DEFAULT 'paystack',
  provider_ref TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed membership tiers
INSERT INTO membership_tiers (code, name, description, is_paid, billing_options, badge_label, badge_color, dashboard_theme) VALUES
('FREE', 'Free', 'Basic access to EriggaLive community', false, '[]'::jsonb, 'ECor Erigga Citizen', '#6B7280', 'default'),
('PRO', 'Pro', 'Premium access with exclusive content and features', true, '["monthly", "quarterly", "annually"]'::jsonb, 'Erigga Indigen', '#4B9CD3', 'default'),
('ENT', 'Enterprise', 'VIP access with gold dashboard and exclusive perks', true, '["annually"]'::jsonb, 'E', '#FFD700', 'gold')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_paid = EXCLUDED.is_paid,
  billing_options = EXCLUDED.billing_options,
  badge_label = EXCLUDED.badge_label,
  badge_color = EXCLUDED.badge_color,
  dashboard_theme = EXCLUDED.dashboard_theme,
  updated_at = NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tier_code ON memberships(tier_code);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_id ON wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_ref);

-- Enable RLS
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- membership_tiers: readable by all authenticated users
CREATE POLICY "membership_tiers_read" ON membership_tiers FOR SELECT TO authenticated USING (true);

-- memberships: users can only see their own memberships
CREATE POLICY "memberships_read_own" ON memberships FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "memberships_insert_own" ON memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memberships_update_own" ON memberships FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- wallets: users can only see their own wallet
CREATE POLICY "wallets_read_own" ON wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wallets_insert_own" ON wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_update_own" ON wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- wallet_ledger: users can only see their own transactions
CREATE POLICY "wallet_ledger_read_own" ON wallet_ledger FOR SELECT TO authenticated 
  USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));
CREATE POLICY "wallet_ledger_insert_own" ON wallet_ledger FOR INSERT TO authenticated 
  WITH CHECK (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

-- payments: users can only see their own payments
CREATE POLICY "payments_read_own" ON payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_own" ON payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_update_own" ON payments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Functions
-- Function to get user's current tier
CREATE OR REPLACE FUNCTION get_user_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  current_tier TEXT;
BEGIN
  SELECT tier_code INTO current_tier
  FROM memberships
  WHERE user_id = user_uuid 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY 
    CASE tier_code 
      WHEN 'ENT' THEN 3
      WHEN 'PRO' THEN 2
      WHEN 'FREE' THEN 1
      ELSE 0
    END DESC
  LIMIT 1;
  
  RETURN COALESCE(current_tier, 'FREE');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to credit wallet with coins
CREATE OR REPLACE FUNCTION credit_wallet_coins(user_uuid UUID, coins INTEGER, reason TEXT, ref_id TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  wallet_uuid UUID;
BEGIN
  -- Get or create wallet
  INSERT INTO wallets (user_id, balance_coins)
  VALUES (user_uuid, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT id INTO wallet_uuid FROM wallets WHERE user_id = user_uuid;
  
  -- Update balance
  UPDATE wallets 
  SET balance_coins = balance_coins + coins,
      updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Log transaction
  INSERT INTO wallet_ledger (wallet_id, type, amount_coins, reason, ref_id)
  VALUES (wallet_uuid, 'credit', coins, reason, ref_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process membership upgrade
CREATE OR REPLACE FUNCTION process_membership_upgrade(
  user_uuid UUID,
  tier_code TEXT,
  months INTEGER,
  payment_ref TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  coins_to_credit INTEGER;
BEGIN
  -- Calculate coins based on tier and months
  coins_to_credit := CASE 
    WHEN tier_code = 'PRO' THEN months * 1000
    WHEN tier_code = 'ENT' THEN 12000
    ELSE 0
  END;
  
  -- Create or update membership
  INSERT INTO memberships (user_id, tier_code, expires_at, months_purchased, status)
  VALUES (
    user_uuid, 
    tier_code,
    CASE 
      WHEN tier_code = 'FREE' THEN NULL
      ELSE NOW() + (months || ' months')::INTERVAL
    END,
    months,
    'active'
  )
  ON CONFLICT (user_id, tier_code) 
  DO UPDATE SET
    expires_at = CASE 
      WHEN tier_code = 'FREE' THEN NULL
      ELSE GREATEST(COALESCE(memberships.expires_at, NOW()), NOW()) + (months || ' months')::INTERVAL
    END,
    months_purchased = memberships.months_purchased + months,
    status = 'active',
    updated_at = NOW();
  
  -- Credit coins if applicable
  IF coins_to_credit > 0 THEN
    PERFORM credit_wallet_coins(user_uuid, coins_to_credit, 'membership_bonus', payment_ref);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_membership_tiers_updated_at BEFORE UPDATE ON membership_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
