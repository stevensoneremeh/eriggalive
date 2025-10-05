-- Create missions and referral system tables
CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  mission_type VARCHAR(50) NOT NULL CHECK (mission_type IN ('daily', 'weekly', 'achievement', 'special')),
  category VARCHAR(50) NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 0,
  coins_reward INTEGER NOT NULL DEFAULT 0,
  requirements JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_missions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

CREATE TABLE IF NOT EXISTS user_referrals (
  id SERIAL PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Add referral_code to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_missions_type_active ON missions(mission_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_completed ON user_missions(is_completed, completed_at);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Insert sample missions
INSERT INTO missions (title, description, mission_type, category, points_reward, coins_reward, requirements) VALUES
('Daily Login', 'Login to the platform daily', 'daily', 'engagement', 10, 5, '{"login_count": 1}'),
('First Post', 'Create your first community post', 'achievement', 'social', 50, 25, '{"posts_created": 1}'),
('Social Butterfly', 'Follow 5 other users', 'achievement', 'social', 100, 50, '{"users_followed": 5}'),
('Active Commenter', 'Leave 10 comments on posts', 'weekly', 'engagement', 75, 35, '{"comments_created": 10}'),
('Coin Collector', 'Earn 500 Erigga Coins', 'achievement', 'economy', 200, 100, '{"coins_earned": 500}'),
('Community Helper', 'Vote on 20 posts', 'weekly', 'engagement', 60, 30, '{"votes_given": 20}'),
('Referral Master', 'Refer 5 new users', 'achievement', 'growth', 500, 1000, '{"referrals_completed": 5}');

-- RLS Policies
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;

-- Missions are public to read
CREATE POLICY "Missions are viewable by everyone" ON missions FOR SELECT USING (true);

-- Users can view their own mission progress
CREATE POLICY "Users can view own mission progress" ON user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own mission progress" ON user_missions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mission progress" ON user_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their referrals
CREATE POLICY "Users can view own referrals" ON user_referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can insert referrals" ON user_referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'REF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to update referral count
CREATE OR REPLACE FUNCTION update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE users 
    SET referral_count = referral_count + 1 
    WHERE id = NEW.referrer_id;
    
    -- Check if referrer has reached 5 referrals for reward
    IF (SELECT referral_count FROM users WHERE id = NEW.referrer_id) >= 5 THEN
      -- Award 1000 coins
      UPDATE users 
      SET coins = coins + 1000 
      WHERE id = NEW.referrer_id;
      
      -- Mark referrals as rewarded
      UPDATE user_referrals 
      SET reward_claimed = true 
      WHERE referrer_id = NEW.referrer_id AND status = 'completed' AND NOT reward_claimed;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for referral rewards
CREATE TRIGGER trigger_update_referral_count
  AFTER UPDATE ON user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_count();

-- Function to auto-generate referral code for new users
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code = generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral codes
CREATE TRIGGER trigger_auto_generate_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_referral_code();
