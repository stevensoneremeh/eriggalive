-- Create tiers table
CREATE TABLE IF NOT EXISTS public.tiers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    benefits TEXT[] DEFAULT '{}',
    rank INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table for tier upgrades
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tier_id BIGINT NOT NULL REFERENCES public.tiers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled', 'refunded')),
    payment_method VARCHAR(20) DEFAULT 'paystack',
    reference VARCHAR(100) UNIQUE NOT NULL,
    paystack_reference VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tier_upgrades table for tracking upgrade requests
CREATE TABLE IF NOT EXISTS public.tier_upgrades (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    from_tier_id BIGINT REFERENCES public.tiers(id),
    to_tier_id BIGINT NOT NULL REFERENCES public.tiers(id),
    payment_id BIGINT REFERENCES public.payments(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    upgrade_pending BOOLEAN DEFAULT false,
    admin_notes TEXT,
    approved_by BIGINT REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_config table for admin settings
CREATE TABLE IF NOT EXISTS public.system_config (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO public.tiers (name, slug, description, price, benefits, rank) VALUES
('Grassroot', 'grassroot', 'Free tier with basic access', 0, 
 ARRAY['Access to community feed', 'Basic profile customization', 'Standard support', 'Public content access'], 0),
('Pioneer', 'pioneer', 'Enhanced experience with exclusive content', 2500, 
 ARRAY['Early access to new drops', 'Exclusive behind-the-scenes content', '10% discount on merch', 'Priority event tickets', 'Pioneer profile badge', 'Access to premium discussions', 'Monthly exclusive freestyles'], 1),
('Elder', 'elder', 'VIP access with direct artist interaction', 5000, 
 ARRAY['Everything in Pioneer', 'VIP access to all events', '20% discount on merch & tickets', 'Direct access to exclusive content', 'Elder Circle badge', 'Monthly video calls with Erigga', 'First access to new music', 'Exclusive merchandise', 'Premium customer support'], 2),
('Blood', 'blood', 'Ultimate tier with lifetime benefits', 10000, 
 ARRAY['Everything in Elder', 'Backstage access at events', '30% discount on all purchases', 'Personalized birthday message', 'Blood badge (highest tier)', 'Quarterly private sessions', 'Input on upcoming releases', 'Limited edition merchandise', 'Direct contact with Erigga', 'Lifetime membership benefits'], 3)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    benefits = EXCLUDED.benefits,
    rank = EXCLUDED.rank,
    updated_at = NOW();

-- Insert system config for manual approval
INSERT INTO public.system_config (key, value, description) VALUES
('manual_tier_approval', 'false', 'Whether tier upgrades require manual admin approval')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Add tier_id to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier_id') THEN
        ALTER TABLE public.users ADD COLUMN tier_id BIGINT REFERENCES public.tiers(id) DEFAULT 1;
    END IF;
END $$;

-- Update existing users to have grassroot tier
UPDATE public.users SET tier_id = 1 WHERE tier_id IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_tier_upgrades_user_id ON public.tier_upgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_upgrades_status ON public.tier_upgrades(status);
CREATE INDEX IF NOT EXISTS idx_tiers_rank ON public.tiers(rank);
CREATE INDEX IF NOT EXISTS idx_tiers_slug ON public.tiers(slug);

-- Create function to handle tier upgrade after payment
CREATE OR REPLACE FUNCTION handle_tier_upgrade()
RETURNS TRIGGER AS $$
DECLARE
    manual_approval BOOLEAN;
    upgrade_record RECORD;
BEGIN
    -- Only process completed payments
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Get manual approval setting
        SELECT (value->>'manual_tier_approval')::BOOLEAN INTO manual_approval
        FROM public.system_config WHERE key = 'manual_tier_approval';
        
        -- Get the tier upgrade record
        SELECT * INTO upgrade_record
        FROM public.tier_upgrades 
        WHERE payment_id = NEW.id;
        
        IF upgrade_record IS NOT NULL THEN
            IF manual_approval THEN
                -- Set upgrade as pending approval
                UPDATE public.tier_upgrades 
                SET upgrade_pending = true, status = 'pending'
                WHERE id = upgrade_record.id;
            ELSE
                -- Auto-approve upgrade
                UPDATE public.users 
                SET tier_id = upgrade_record.to_tier_id, updated_at = NOW()
                WHERE id = upgrade_record.user_id;
                
                UPDATE public.tier_upgrades 
                SET status = 'completed', approved_at = NOW()
                WHERE id = upgrade_record.id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic tier upgrade
DROP TRIGGER IF EXISTS trigger_handle_tier_upgrade ON public.payments;
CREATE TRIGGER trigger_handle_tier_upgrade
    AFTER UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION handle_tier_upgrade();

-- Enable RLS
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tiers (public read)
CREATE POLICY "Tiers are viewable by everyone" ON public.tiers
    FOR SELECT USING (is_active = true);

-- RLS Policies for payments (users can only see their own)
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- RLS Policies for tier_upgrades (users can only see their own)
CREATE POLICY "Users can view own tier upgrades" ON public.tier_upgrades
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own tier upgrades" ON public.tier_upgrades
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- RLS Policies for system_config (read-only for authenticated users)
CREATE POLICY "System config is readable by authenticated users" ON public.system_config
    FOR SELECT USING (auth.role() = 'authenticated');
