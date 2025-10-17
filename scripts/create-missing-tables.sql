-- =====================================================
-- CREATE MISSING TABLES TO FIX 404 ERRORS
-- =====================================================

-- Create vault_views table (referenced in dashboard but missing)
CREATE TABLE IF NOT EXISTS public.vault_views (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    media_id BIGINT REFERENCES public.media_items(id) ON DELETE CASCADE,
    view_duration INTEGER DEFAULT 0, -- in seconds
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create store_purchases table (referenced in dashboard but missing)
CREATE TABLE IF NOT EXISTS public.store_purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
    order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_naira INTEGER NOT NULL DEFAULT 0,
    unit_price_coins INTEGER NOT NULL DEFAULT 0,
    total_naira INTEGER NOT NULL DEFAULT 0,
    total_coins INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    payment_method TEXT CHECK (payment_method IN ('coins', 'naira', 'paystack')),
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure user_follows table exists (should exist but might be missing)
CREATE TABLE IF NOT EXISTS public.user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Add RLS policies for the new tables
ALTER TABLE public.vault_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Vault views policies
CREATE POLICY "Users can view their own vault views" ON public.vault_views
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can create their own vault views" ON public.vault_views
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- Store purchases policies
CREATE POLICY "Users can view their own purchases" ON public.store_purchases
    FOR SELECT USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can create their own purchases" ON public.store_purchases
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
    );

-- User follows policies
CREATE POLICY "Follows are viewable by authenticated users" ON public.user_follows
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own follows" ON public.user_follows
    FOR ALL USING (
        auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = follower_id)
    );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vault_views_user_id ON public.vault_views(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_views_media_id ON public.vault_views(media_id);
CREATE INDEX IF NOT EXISTS idx_store_purchases_user_id ON public.store_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_store_purchases_order_id ON public.store_purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vault_views_updated_at BEFORE UPDATE ON public.vault_views
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_purchases_updated_at BEFORE UPDATE ON public.store_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
