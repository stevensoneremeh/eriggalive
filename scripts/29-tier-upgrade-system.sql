-- Create tiers table
CREATE TABLE IF NOT EXISTS public.tiers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  benefits TEXT[] DEFAULT '{}',
  rank INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#gray',
  icon TEXT DEFAULT 'star',
  is_active BOOLEAN DEFAULT true,
  max_users INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table for tier upgrades
CREATE TABLE IF NOT EXISTS public.tier_payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier_id BIGINT NOT NULL REFERENCES public.tiers(id),
  previous_tier TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'canceled')) DEFAULT 'pending',
  payment_method TEXT DEFAULT 'paystack',
  reference TEXT UNIQUE NOT NULL,
  external_reference TEXT,
  upgrade_pending BOOLEAN DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tier upgrade settings table
CREATE TABLE IF NOT EXISTS public.tier_upgrade_settings (
  id BIGSERIAL PRIMARY KEY,
  manual_approval BOOLEAN DEFAULT false,
  auto_upgrade_delay_minutes INTEGER DEFAULT 0,
  max_upgrades_per_day INTEGER DEFAULT 10,
  allow_downgrades BOOLEAN DEFAULT false,
  notification_webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO public.tiers (name, display_name, description, price, benefits, rank, color, icon) VALUES
('grassroot', 'Grassroot', 'Join the movement and access basic community features', 0, 
 ARRAY['Access to community feed', 'Basic profile customization', 'Standard support', 'Public content access'], 
 0, '#6b7280', 'star'),
('pioneer', 'Pioneer', 'Get early access and exclusive content', 2500, 
 ARRAY['Early access to new drops', 'Exclusive behind-the-scenes content', '10% discount on merch', 'Priority event tickets', 'Pioneer profile badge', 'Access to premium discussions', 'Monthly exclusive freestyles'], 
 1, '#f97316', 'crown'),
('elder', 'Elder', 'VIP access and premium benefits', 5000, 
 ARRAY['Everything in Pioneer', 'VIP access to all events', '20% discount on merch & tickets', 'Direct access to exclusive content', 'Elder Circle badge', 'Monthly video calls with Erigga', 'First access to new music', 'Exclusive merchandise', 'Premium customer support'], 
 2, '#eab308', 'shield'),
('blood', 'Blood Brotherhood', 'Ultimate tier with lifetime benefits', 10000, 
 ARRAY['Everything in Elder', 'Backstage access at events', '30% discount on all purchases', 'Personalized birthday message', 'Blood badge (highest tier)', 'Quarterly private sessions', 'Input on upcoming releases', 'Limited edition merchandise', 'Direct contact with Erigga', 'Lifetime membership benefits'], 
 3, '#dc2626', 'droplets')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  benefits = EXCLUDED.benefits,
  rank = EXCLUDED.rank,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;

-- Insert default settings
INSERT INTO public.tier_upgrade_settings (manual_approval, auto_upgrade_delay_minutes, max_upgrades_per_day) 
VALUES (false, 0, 50)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tiers_rank ON public.tiers(rank);
CREATE INDEX IF NOT EXISTS idx_tiers_active ON public.tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_tier_payments_user ON public.tier_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_payments_status ON public.tier_payments(status);
CREATE INDEX IF NOT EXISTS idx_tier_payments_reference ON public.tier_payments(reference);

-- Update trigger for tiers
CREATE OR REPLACE FUNCTION update_tier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_tiers_updated_at
  BEFORE UPDATE ON public.tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_updated_at();

CREATE OR REPLACE TRIGGER update_tier_payments_updated_at
  BEFORE UPDATE ON public.tier_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_updated_at();

-- Function to handle tier upgrade after successful payment
CREATE OR REPLACE FUNCTION handle_tier_upgrade(
  p_user_id BIGINT,
  p_tier_id BIGINT,
  p_payment_reference TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier_name TEXT;
  v_settings_manual_approval BOOLEAN;
BEGIN
  -- Get tier name
  SELECT name INTO v_tier_name FROM public.tiers WHERE id = p_tier_id;
  
  -- Get upgrade settings
  SELECT manual_approval INTO v_settings_manual_approval 
  FROM public.tier_upgrade_settings 
  ORDER BY id DESC LIMIT 1;
  
  -- If manual approval is disabled, upgrade immediately
  IF NOT COALESCE(v_settings_manual_approval, false) THEN
    -- Update user tier
    UPDATE public.users 
    SET tier = v_tier_name, updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Mark payment as completed
    UPDATE public.tier_payments 
    SET status = 'completed', upgrade_pending = false, updated_at = NOW()
    WHERE reference = p_payment_reference;
    
    RETURN true;
  ELSE
    -- Mark as pending approval
    UPDATE public.tier_payments 
    SET upgrade_pending = true, updated_at = NOW()
    WHERE reference = p_payment_reference;
    
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_upgrade_settings ENABLE ROW LEVEL SECURITY;

-- Tiers are publicly readable
CREATE POLICY "Tiers are publicly readable" ON public.tiers
  FOR SELECT USING (is_active = true);

-- Users can read their own tier payments
CREATE POLICY "Users can read own tier payments" ON public.tier_payments
  FOR SELECT USING (user_id = (
    SELECT id FROM public.users 
    WHERE auth_user_id = auth.uid()
  ));

-- Only authenticated users can create tier payments
CREATE POLICY "Authenticated users can create tier payments" ON public.tier_payments
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Only service role can read tier upgrade settings
CREATE POLICY "Service role can read tier upgrade settings" ON public.tier_upgrade_settings
  FOR SELECT USING (auth.role() = 'service_role');
