-- Complete membership system with wallet and coin management

-- Create membership_tiers table
CREATE TABLE IF NOT EXISTS membership_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  coin_bonus INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL REFERENCES membership_tiers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  billing_interval TEXT CHECK (billing_interval IN ('monthly', 'quarterly', 'annually')),
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create wallet_ledger table for transaction history
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'paystack',
  metadata JSONB DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert membership tiers
INSERT INTO membership_tiers (id, name, label, price, features, coin_bonus, color) VALUES
('FREE', 'Free', 'ECor Erigga Citizen', 0, '["Basic community access", "General chat rooms", "Limited content access"]', 0, 'green'),
('PRO', 'Pro', 'Erigga Indigen', 25000, '["All Free features", "Premium chat rooms", "Exclusive content", "Priority support", "1,000 coins per month"]', 1000, 'blue'),
('ENT', 'Enterprise', 'E', 150000, '["All Pro features", "VIP access", "Direct artist interaction", "Custom gold dashboard", "12,000 coins annually"]', 12000, 'gold')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  label = EXCLUDED.label,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  coin_bonus = EXCLUDED.coin_bonus,
  color = EXCLUDED.color,
  updated_at = NOW();

-- Create function to add coins
CREATE OR REPLACE FUNCTION add_coins(user_id UUID, amount INTEGER, description TEXT DEFAULT 'Coin addition')
RETURNS VOID AS $$
DECLARE
  wallet_record RECORD;
BEGIN
  -- Get or create wallet
  INSERT INTO wallets (user_id, balance) 
  VALUES (user_id, 0) 
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO wallet_record FROM wallets WHERE wallets.user_id = add_coins.user_id;
  
  -- Update wallet balance
  UPDATE wallets 
  SET balance = balance + amount, updated_at = NOW() 
  WHERE wallets.user_id = add_coins.user_id;
  
  -- Add ledger entry
  INSERT INTO wallet_ledger (user_id, wallet_id, amount, type, description)
  VALUES (user_id, wallet_record.id, amount, 'credit', description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to deduct coins
CREATE OR REPLACE FUNCTION deduct_coins(user_id UUID, amount INTEGER, description TEXT DEFAULT 'Coin deduction')
RETURNS BOOLEAN AS $$
DECLARE
  wallet_record RECORD;
  current_balance INTEGER;
BEGIN
  SELECT * INTO wallet_record FROM wallets WHERE wallets.user_id = deduct_coins.user_id;
  
  IF wallet_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  current_balance := wallet_record.balance;
  
  IF current_balance < amount THEN
    RETURN FALSE;
  END IF;
  
  -- Update wallet balance
  UPDATE wallets 
  SET balance = balance - amount, updated_at = NOW() 
  WHERE wallets.user_id = deduct_coins.user_id;
  
  -- Add ledger entry
  INSERT INTO wallet_ledger (user_id, wallet_id, amount, type, description)
  VALUES (user_id, wallet_record.id, amount, 'debit', description);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically create wallet and membership for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create wallet
  INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 0);
  
  -- Create free membership
  INSERT INTO memberships (user_id, tier_id, status, amount_paid) 
  VALUES (NEW.id, 'FREE', 'active', 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view membership tiers" ON membership_tiers FOR SELECT USING (true);

CREATE POLICY "Users can view own membership" ON memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON memberships FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own wallet ledger" ON wallet_ledger FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tier_id ON memberships(tier_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_id ON wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
