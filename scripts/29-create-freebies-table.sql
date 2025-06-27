-- Create freebies table for monthly free items
CREATE TABLE IF NOT EXISTS public.freebies (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    available_until TIMESTAMPTZ NOT NULL,
    max_claims INTEGER DEFAULT 100,
    current_claims INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create freebie_claims table to track user claims
CREATE TABLE IF NOT EXISTS public.freebie_claims (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    freebie_id BIGINT NOT NULL REFERENCES public.freebies(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, freebie_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_freebies_available_until ON public.freebies(available_until);
CREATE INDEX IF NOT EXISTS idx_freebies_is_active ON public.freebies(is_active);
CREATE INDEX IF NOT EXISTS idx_freebie_claims_user_id ON public.freebie_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_freebie_claims_freebie_id ON public.freebie_claims(freebie_id);
CREATE INDEX IF NOT EXISTS idx_freebie_claims_claimed_at ON public.freebie_claims(claimed_at);

-- Enable RLS
ALTER TABLE public.freebies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebie_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for freebies (everyone can read active freebies)
CREATE POLICY "Anyone can view active freebies" ON public.freebies
    FOR SELECT USING (is_active = true AND available_until > NOW());

-- RLS Policies for freebie_claims (users can only see their own claims)
CREATE POLICY "Users can view their own claims" ON public.freebie_claims
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert their own claims" ON public.freebie_claims
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Function to update current_claims when a new claim is made
CREATE OR REPLACE FUNCTION update_freebie_claims_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.freebies 
        SET current_claims = current_claims + 1,
            updated_at = NOW()
        WHERE id = NEW.freebie_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.freebies 
        SET current_claims = GREATEST(current_claims - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.freebie_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update claims count
DROP TRIGGER IF EXISTS trigger_update_freebie_claims_count ON public.freebie_claims;
CREATE TRIGGER trigger_update_freebie_claims_count
    AFTER INSERT OR DELETE ON public.freebie_claims
    FOR EACH ROW EXECUTE FUNCTION update_freebie_claims_count();

-- Insert sample freebies for current month
INSERT INTO public.freebies (title, description, image_url, available_until, max_claims) VALUES
(
    'Erigga Sticker Pack',
    'Exclusive set of 10 Erigga-themed stickers featuring iconic lyrics and artwork',
    '/placeholder.svg?height=200&width=200&text=Sticker+Pack',
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' + TIME '23:59:59',
    50
),
(
    'Digital Wallpaper Collection',
    'High-resolution wallpapers for your phone and desktop featuring Erigga artwork',
    '/placeholder.svg?height=200&width=200&text=Wallpapers',
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' + TIME '23:59:59',
    100
),
(
    'Exclusive Behind-the-Scenes Video',
    'Rare footage from Erigga\'s latest music video shoot - never seen before!',
    '/placeholder.svg?height=200&width=200&text=BTS+Video',
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' + TIME '23:59:59',
    25
);

-- Grant necessary permissions
GRANT SELECT ON public.freebies TO anon, authenticated;
GRANT SELECT, INSERT ON public.freebie_claims TO authenticated;
GRANT USAGE ON SEQUENCE public.freebie_claims_id_seq TO authenticated;
