-- Fixed Freebies Schema Script
-- This script handles the user_tier enum and foreign key constraints properly

-- First, create the user_tier enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create freebies table
CREATE TABLE IF NOT EXISTS public.freebies (
    id bigint primary key generated always as identity,
    name text not null check (length(name) >= 1),
    slug text unique not null,
    description text,
    short_description text,
    images text[] default '{}',
    thumbnail_url text,
    category text not null,
    subcategory text,
    brand text default 'Erigga',
    required_tier user_tier default 'grassroot',
    stock_quantity integer default 0 check (stock_quantity >= 0),
    max_per_user integer default 1 check (max_per_user > 0),
    claim_count integer default 0 check (claim_count >= 0),
    total_claims integer default 0 check (total_claims >= 0),
    is_active boolean default true,
    is_featured boolean default false,
    requires_shipping boolean default true,
    weight numeric,
    dimensions jsonb default '{}',
    tags text[] default '{}',
    expires_at timestamp with time zone,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create freebie claims table with proper user reference
CREATE TABLE IF NOT EXISTS public.freebie_claims (
    id bigint primary key generated always as identity,
    user_id uuid not null, -- Changed to uuid to match auth.users
    freebie_id bigint references public.freebies(id) on delete cascade,
    status text default 'pending' check (status in ('pending', 'approved', 'shipped', 'delivered', 'rejected')),
    shipping_address jsonb not null,
    tracking_number text,
    notes text,
    claimed_at timestamp with time zone default now(),
    processed_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(user_id, freebie_id)
);

-- Add foreign key constraint to auth.users directly
ALTER TABLE public.freebie_claims 
ADD CONSTRAINT fk_freebie_claims_auth_users 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_freebies_category ON public.freebies(category);
CREATE INDEX IF NOT EXISTS idx_freebies_required_tier ON public.freebies(required_tier);
CREATE INDEX IF NOT EXISTS idx_freebies_is_active ON public.freebies(is_active);
CREATE INDEX IF NOT EXISTS idx_freebies_is_featured ON public.freebies(is_featured);
CREATE INDEX IF NOT EXISTS idx_freebies_expires_at ON public.freebies(expires_at);
CREATE INDEX IF NOT EXISTS idx_freebies_created_at ON public.freebies(created_at);

CREATE INDEX IF NOT EXISTS idx_freebie_claims_user_id ON public.freebie_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_freebie_claims_freebie_id ON public.freebie_claims(freebie_id);
CREATE INDEX IF NOT EXISTS idx_freebie_claims_status ON public.freebie_claims(status);
CREATE INDEX IF NOT EXISTS idx_freebie_claims_claimed_at ON public.freebie_claims(claimed_at);

-- Create RLS policies
ALTER TABLE public.freebies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebie_claims ENABLE ROW LEVEL SECURITY;

-- Freebies policies
CREATE POLICY "Freebies are viewable by everyone" ON public.freebies
    FOR SELECT USING (is_active = true);

-- Admin policy for freebies
CREATE POLICY "Admins can manage freebies" ON public.freebies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Freebie claims policies
CREATE POLICY "Users can view their own claims" ON public.freebie_claims
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can create their own claims" ON public.freebie_claims
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update claims" ON public.freebie_claims
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_freebies_updated_at ON public.freebies;
CREATE TRIGGER update_freebies_updated_at 
    BEFORE UPDATE ON public.freebies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_freebie_claims_updated_at ON public.freebie_claims;
CREATE TRIGGER update_freebie_claims_updated_at 
    BEFORE UPDATE ON public.freebie_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample freebies data
INSERT INTO public.freebies (name, slug, description, category, required_tier, stock_quantity, max_per_user, is_active, is_featured, images) VALUES
('Erigga Sticker Pack', 'erigga-sticker-pack', 'Collection of exclusive Erigga stickers featuring iconic lyrics and artwork', 'collectibles', 'grassroot', 100, 1, true, true, ARRAY['/placeholder.svg?height=300&width=300&text=Sticker+Pack']),
('Paper Boi Keychain', 'paper-boi-keychain', 'Metal keychain with Paper Boi logo and Erigga signature', 'accessories', 'pioneer', 50, 1, true, false, ARRAY['/placeholder.svg?height=300&width=300&text=Keychain']),
('Warri Vibe Poster', 'warri-vibe-poster', 'High-quality poster celebrating Warri culture and Erigga''s roots', 'collectibles', 'elder', 25, 1, true, true, ARRAY['/placeholder.svg?height=400&width=300&text=Poster']),
('Exclusive Digital Wallpaper Pack', 'digital-wallpaper-pack', 'HD wallpapers for phone and desktop featuring Erigga artwork', 'digital', 'grassroot', 1000, 1, true, false, ARRAY['/placeholder.svg?height=300&width=300&text=Wallpapers']),
('Limited Edition Bandana', 'limited-edition-bandana', 'Premium bandana with exclusive Erigga design - Blood tier only', 'accessories', 'blood', 10, 1, true, true, ARRAY['/placeholder.svg?height=300&width=300&text=Bandana'])
ON CONFLICT (slug) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.freebies TO authenticated;
GRANT ALL ON public.freebie_claims TO authenticated;
GRANT USAGE ON SEQUENCE freebies_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE freebie_claims_id_seq TO authenticated;
