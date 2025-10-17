-- Complete Membership System Implementation
-- This migration creates the full tiered membership system with proper pricing and coin incentives

-- Create membership_tiers table with new tier structure
CREATE TABLE IF NOT EXISTS membership_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge_label TEXT NOT NULL,
  badge_color TEXT NOT NULL DEFAULT '#6B7280',
  monthly_price INTEGER DEFAULT 0,
  quarterly_price INTEGER DEFAULT 0,
  annual_price INTEGER DEFAULT 0,
  coin_bonus_monthly INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the three membership tiers as specified
INSERT INTO membership_tiers (id, name, badge_label, badge_color, monthly_price, quarterly_price, annual_price, coin_bonus_monthly, features) VALUES
('FREE', 'Free', 'ECor Erigga Citizen', '#6B7280', 0, 0, 0, 0, '["Community access", "Basic profile", "Public content"]'::jsonb),
('PRO', 'Pro', 'Erigga Indigen', '#3B82F6', 8000, 21600, 76800, 1000, '["Everything in Free", "Early access", "15% merch discount", "Priority tickets", "Monthly exclusive content"]'::jsonb),
('ENT', 'Enterprise', 'E', '#FFD700', 25000, 67500, 240000, 12000, '["Everything in Pro", "VIP access", "30% discount", "Direct contact", "Quarterly private sessions", "Custom amount option"]'::jsonb);

-- Create user_memberships table
CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL REFERENCES membership_tiers(id),
  billing_interval TEXT CHECK (billing_interval IN ('monthly', 'quarterly', 'annual', 'custom')),
  custom_amount INTEGER, -- For Enterprise custom pricing
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user_wallets table for coin management
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_bonus_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create wallet_transactions table for transaction history
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bonus', 'purchase', 'refund', 'admin_adjustment')),
  amount INTEGER NOT NULL,
  description TEXT,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table for payment tracking
CREATE TABLE IF NOT EXISTS membership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES user_memberships(id) ON DELETE SET NULL,
  paystack_reference TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  payment_method TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Membership tiers are public
CREATE POLICY "Membership tiers are viewable by everyone" ON membership_tiers FOR SELECT USING (true);

-- Users can only see their own membership data
CREATE POLICY "Users can view own membership" ON user_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own membership" ON user_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON user_memberships FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own wallet data
CREATE POLICY "Users can view own wallet" ON user_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON user_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON user_wallets FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON wallet_transactions FOR INSERT WITH CHECK (true);

-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON membership_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage payments" ON membership_payments FOR ALL USING (true);

-- Functions for membership management
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_wallets (user_id) VALUES (NEW.id);
  INSERT INTO user_memberships (user_id, tier_id) VALUES (NEW.id, 'FREE');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet and membership for new users
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Function to add monthly coin bonus
CREATE OR REPLACE FUNCTION add_monthly_coin_bonus(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  membership_record RECORD;
  wallet_record RECORD;
  bonus_amount INTEGER;
BEGIN
  -- Get user's current membership
  SELECT um.*, mt.coin_bonus_monthly 
  INTO membership_record
  FROM user_memberships um
  JOIN membership_tiers mt ON um.tier_id = mt.id
  WHERE um.user_id = user_uuid AND um.status = 'active';
  
  IF NOT FOUND OR membership_record.coin_bonus_monthly = 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Check if bonus already given this month
  SELECT * INTO wallet_record
  FROM user_wallets
  WHERE user_id = user_uuid
  AND last_bonus_at > DATE_TRUNC('month', NOW());
  
  IF FOUND THEN
    RETURN FALSE; -- Already received bonus this month
  END IF;
  
  bonus_amount := membership_record.coin_bonus_monthly;
  
  -- Add coins to wallet
  UPDATE user_wallets
  SET 
    coin_balance = coin_balance + bonus_amount,
    total_earned = total_earned + bonus_amount,
    last_bonus_at = NOW(),
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Record transaction
  INSERT INTO wallet_transactions (user_id, type, amount, description, reference_id)
  VALUES (user_uuid, 'bonus', bonus_amount, 'Monthly membership bonus', membership_record.id::TEXT);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate Enterprise minimum payment
CREATE OR REPLACE FUNCTION validate_enterprise_payment(amount INTEGER, tier_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF tier_id = 'ENT' AND amount < 150000 THEN
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_tier_id ON user_memberships(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_payments_user_id ON membership_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_payments_reference ON membership_payments(paystack_reference);
