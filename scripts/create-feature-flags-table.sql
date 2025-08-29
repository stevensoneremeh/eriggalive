-- Create feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_segments TEXT[] DEFAULT '{}',
  environment TEXT DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production', 'all')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_expires_at ON feature_flags(expires_at);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Feature flags are viewable by authenticated users" ON feature_flags
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Feature flags are manageable by admins" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Insert some default feature flags
INSERT INTO feature_flags (id, name, description, enabled, environment, rollout_percentage) VALUES
  ('enhanced_community_ui', 'Enhanced Community UI', 'New mobile-first community page design', true, 'all', 100),
  ('improved_radio_shoutouts', 'Improved Radio Shout-outs', 'Enhanced shout-out visibility and duration', true, 'all', 100),
  ('wallet_balance_fixes', 'Wallet Balance Fixes', 'Fixed wallet balance display and purchase flow', true, 'all', 100),
  ('event_pricing_fixes', 'Event Pricing Fixes', 'Corrected event checkout pricing and QR generation', true, 'all', 100),
  ('beta_features', 'Beta Features Access', 'Access to experimental features', false, 'development', 50),
  ('premium_features', 'Premium Features', 'Features available to premium users only', true, 'all', 100)
ON CONFLICT (id) DO NOTHING;
