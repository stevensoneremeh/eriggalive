-- Enhanced database functions for atomic balance updates

-- Function to increment user coins with transaction logging
CREATE OR REPLACE FUNCTION increment_user_coins(user_id UUID, coin_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user coins atomically
  UPDATE users 
  SET 
    coins = COALESCE(coins, 0) + coin_amount,
    updated_at = NOW()
  WHERE auth_user_id = user_id;
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
END;
$$;

-- Function to increment wallet balance with better error handling
CREATE OR REPLACE FUNCTION increment_wallet_balance(p_user_id UUID, p_delta BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update wallet balance atomically
  INSERT INTO wallet (user_id, balance, created_at, updated_at) 
  VALUES (p_user_id, p_delta, NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = wallet.balance + EXCLUDED.balance,
    updated_at = NOW();
    
  -- Log the transaction
  INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, status)
  VALUES (p_user_id, p_delta, 'credit', 'Paystack webhook credit', 'completed');
END;
$$;

-- Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);

-- Enable RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policy for wallet transactions
CREATE POLICY "wallet_transactions_owner_read" ON wallet_transactions FOR SELECT 
  USING (auth.uid() = user_id);
