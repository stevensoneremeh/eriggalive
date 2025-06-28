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

-- Create freebie claims table
CREATE TABLE IF NOT EXISTS public.freebie_claims (
    id bigint primary key generated always as identity,
    user_id bigint references public.user_profiles(id) on delete cascade,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_freebies_category ON public.freebies(category);
CREATE INDEX IF NOT EXISTS idx_freebies_required_tier ON public.freebies(required_tier);
CREATE INDEX IF NOT EXISTS idx_freebies_is_active ON public.freebies(is_active);
CREATE INDEX IF NOT EXISTS idx_freebies_is_featured ON public.freebies(is_featured);
CREATE INDEX IF NOT EXISTS idx_freebies_expires_at ON public.freebies(expires_at);

CREATE INDEX IF NOT EXISTS idx_freebie_claims_user_id ON public.freebie_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_freebie_claims_freebie_id ON public.freebie_claims(freebie_id);
CREATE INDEX IF NOT EXISTS idx_freebie_claims_status ON public.freebie_claims(status);

-- Create RLS policies
ALTER TABLE public.freebies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebie_claims ENABLE ROW LEVEL SECURITY;

-- Freebies policies
CREATE POLICY "Freebies are viewable by everyone" ON public.freebies
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage freebies" ON public.freebies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()::bigint
            AND role IN ('admin', 'super_admin')
        )
    );

-- Freebie claims policies
CREATE POLICY "Users can view their own claims" ON public.freebie_claims
    FOR SELECT USING (
        user_id = auth.uid()::bigint
        OR EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()::bigint
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can create their own claims" ON public.freebie_claims
    FOR INSERT WITH CHECK (user_id = auth.uid()::bigint);

CREATE POLICY "Only admins can update claims" ON public.freebie_claims
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()::bigint
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_freebies_updated_at BEFORE UPDATE ON public.freebies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freebie_claims_updated_at BEFORE UPDATE ON public.freebie_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
