-- Add coins column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Update user tier enum to include new tiers
ALTER TYPE user_tier RENAME TO user_tier_old;
CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
ALTER TABLE users ALTER COLUMN tier TYPE user_tier USING tier::text::user_tier;
DROP TYPE user_tier_old;

-- Create coin_transactions table
CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'withdrawal', 'reward', 'content_access')),
    payment_method TEXT CHECK (payment_method IN ('paystack', 'crypto', 'coins')),
    reference_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_access table
CREATE TABLE IF NOT EXISTS content_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id INTEGER NOT NULL,
    coins_spent INTEGER NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add coin_price column to existing content tables
ALTER TABLE albums ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT 0;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT 0;
ALTER TABLE music_videos ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT 0;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT 0;
ALTER TABLE media_content ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT 0;

-- Update required_tier columns to use new enum
ALTER TABLE albums ALTER COLUMN required_tier TYPE user_tier USING required_tier::text::user_tier;
ALTER TABLE tracks ALTER COLUMN required_tier TYPE user_tier USING required_tier::text::user_tier;
ALTER TABLE music_videos ALTER COLUMN required_tier TYPE user_tier USING required_tier::text::user_tier;
ALTER TABLE gallery_items ALTER COLUMN required_tier TYPE user_tier USING required_tier::text::user_tier;
ALTER TABLE media_content ALTER COLUMN required_tier TYPE user_tier USING required_tier::text::user_tier;

-- Update products table to allow non-premium purchases
ALTER TABLE products ADD COLUMN IF NOT EXISTS coin_price INTEGER DEFAULT 0;
ALTER TABLE products ALTER COLUMN is_premium_only SET DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_status ON coin_transactions(status);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_content_access_user_id ON content_access(user_id);
CREATE INDEX IF NOT EXISTS idx_content_access_content ON content_access(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_access_expires ON content_access(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for coin_transactions
CREATE TRIGGER update_coin_transactions_updated_at 
    BEFORE UPDATE ON coin_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for coin_transactions
CREATE POLICY "Users can view their own transactions" ON coin_transactions
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own transactions" ON coin_transactions
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Create RLS policies for content_access
CREATE POLICY "Users can view their own content access" ON content_access
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own content access" ON content_access
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Insert sample data for testing
INSERT INTO coin_transactions (user_id, amount, transaction_type, payment_method, status, metadata) VALUES
(1, 500, 'purchase', 'paystack', 'completed', '{"reference": "pay_123456789"}'),
(1, -50, 'content_access', 'coins', 'completed', '{"content_type": "video", "content_id": 1}'),
(1, 25, 'reward', 'coins', 'completed', '{"reason": "daily_login"}');

INSERT INTO content_access (user_id, content_type, content_id, coins_spent, expires_at) VALUES
(1, 'video', 1, 50, NOW() + INTERVAL '30 days'),
(1, 'album', 1, 75, NOW() + INTERVAL '30 days');

-- Update existing users to have some coins for testing
UPDATE users SET coins = 1000 WHERE id <= 5;

-- Update existing content with coin prices
UPDATE albums SET coin_price = 75 WHERE is_premium = true;
UPDATE tracks SET coin_price = 25 WHERE is_premium = true;
UPDATE music_videos SET coin_price = 100 WHERE is_premium = true;
UPDATE gallery_items SET coin_price = 15 WHERE is_premium = true;
UPDATE media_content SET coin_price = 50 WHERE is_premium = true;

-- Update products with coin prices (optional payment method)
UPDATE products SET coin_price = price / 10 WHERE price > 0; -- 1 coin = 10 naira equivalent
