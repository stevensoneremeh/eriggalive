-- Add coin_balance to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'coin_balance') THEN
    ALTER TABLE profiles ADD COLUMN coin_balance INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index for coin_balance
CREATE INDEX IF NOT EXISTS idx_profiles_coin_balance ON profiles(coin_balance);

-- Add bank account fields to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'bank_name') THEN
    ALTER TABLE profiles ADD COLUMN bank_name VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'account_number') THEN
    ALTER TABLE profiles ADD COLUMN account_number VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'account_name') THEN
    ALTER TABLE profiles ADD COLUMN account_name VARCHAR(255);
  END IF;
END $$;
