-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for user uploads bucket
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view uploaded files" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create coin_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'earn', 'spend', 'transfer')),
  amount INTEGER NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for coin transactions
CREATE POLICY "Users can view their own transactions" ON coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON coin_transactions
  FOR INSERT WITH CHECK (true);

-- Create function to update user coins balance
CREATE OR REPLACE FUNCTION update_user_coins_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's profile coins balance
  UPDATE user_profiles 
  SET 
    coins_balance = COALESCE(coins_balance, 0) + NEW.amount,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update balance (optional - for certain transaction types)
-- Note: We'll handle balance updates manually in the API for better control
