-- Enhanced database schema for comprehensive platform features

-- Create transactions table for Paystack payments
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  paystack_reference TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL, -- in kobo
  coins_purchased INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank_accounts table for withdrawal system
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, account_number, bank_code)
);

-- Create withdrawals table for withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  amount_coins INTEGER NOT NULL CHECK (amount_coins >= 100000), -- minimum 100k coins
  amount_naira NUMERIC NOT NULL, -- equivalent naira amount
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media_files table for admin uploads
CREATE TABLE IF NOT EXISTS media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to increment user coins safely
CREATE OR REPLACE FUNCTION increment_user_coins(user_id UUID, coin_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET coins = COALESCE(coins, 0) + coin_amount,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Insert coin transaction record
  INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
  VALUES (user_id, coin_amount, 'purchase', 'Coins purchased via Paystack');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process withdrawal with coin deduction
CREATE OR REPLACE FUNCTION create_withdrawal_request(
  p_user_id UUID,
  p_bank_account_id UUID,
  p_coin_amount INTEGER
)
RETURNS UUID AS $$
DECLARE
  withdrawal_id UUID;
  current_balance INTEGER;
  naira_amount NUMERIC;
BEGIN
  -- Check user's current coin balance
  SELECT COALESCE(coins, 0) INTO current_balance
  FROM users WHERE id = p_user_id;
  
  IF current_balance < p_coin_amount THEN
    RAISE EXCEPTION 'Insufficient coin balance';
  END IF;
  
  -- Calculate naira equivalent (10 coins = 1 naira)
  naira_amount := p_coin_amount / 10.0;
  
  -- Deduct coins from user balance
  UPDATE users 
  SET coins = coins - p_coin_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Create withdrawal request
  INSERT INTO withdrawals (user_id, bank_account_id, amount_coins, amount_naira)
  VALUES (p_user_id, p_bank_account_id, p_coin_amount, naira_amount)
  RETURNING id INTO withdrawal_id;
  
  -- Record coin transaction
  INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, -p_coin_amount, 'withdrawal', 'Withdrawal request created');
  
  RETURN withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on new tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bank accounts" ON bank_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all withdrawals" ON withdrawals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND tier IN ('blood_brotherhood', 'elder')
    )
  );

CREATE POLICY "Admin can manage media files" ON media_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND tier IN ('blood_brotherhood', 'elder')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
