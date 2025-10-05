
-- =====================================================
-- ADMIN STREAMING AND VIDEO CALL FEATURES
-- =====================================================

-- Create live_streams table
CREATE TABLE IF NOT EXISTS public.live_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    mux_stream_id TEXT,
    mux_playback_id TEXT,
    mux_stream_key TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    viewer_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vault_media table for admin-managed content
CREATE TABLE IF NOT EXISTS public.vault_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('video', 'audio', 'image', 'document')),
    category TEXT DEFAULT 'General',
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    tier_required TEXT DEFAULT 'free' CHECK (tier_required IN ('free', 'pro', 'enterprise')),
    is_premium BOOLEAN DEFAULT FALSE,
    unlock_price_coins INTEGER,
    unlock_price_naira INTEGER,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    file_size INTEGER,
    duration_seconds INTEGER,
    quality TEXT DEFAULT 'HD',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update meet_greet_bookings table for Daily.co integration
ALTER TABLE public.meet_greet_bookings 
ADD COLUMN IF NOT EXISTS daily_room_url TEXT,
ADD COLUMN IF NOT EXISTS daily_room_name TEXT,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_live_streams_is_live ON public.live_streams(is_live);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_by ON public.live_streams(created_by);
CREATE INDEX IF NOT EXISTS idx_vault_media_type ON public.vault_media(type);
CREATE INDEX IF NOT EXISTS idx_vault_media_category ON public.vault_media(category);
CREATE INDEX IF NOT EXISTS idx_vault_media_tier_required ON public.vault_media(tier_required);
CREATE INDEX IF NOT EXISTS idx_vault_media_is_published ON public.vault_media(is_published);
CREATE INDEX IF NOT EXISTS idx_meet_greet_bookings_status ON public.meet_greet_bookings(status);

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_streams
CREATE POLICY "live_streams_select_all" ON public.live_streams
FOR SELECT
USING (is_live = true OR auth.uid() IS NOT NULL);

CREATE POLICY "live_streams_admin_all" ON public.live_streams
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND (role = 'admin' OR role = 'super_admin')
    )
    OR 
    auth.jwt() ->> 'email' = 'info@eriggalive.com'
);

-- RLS Policies for vault_media
CREATE POLICY "vault_media_select_by_tier" ON public.vault_media
FOR SELECT
USING (
    is_published = true AND (
        tier_required = 'free' OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() AND (
                CASE 
                    WHEN tier_required = 'enterprise' THEN tier IN ('enterprise', 'elder', 'blood_brotherhood')
                    WHEN tier_required = 'pro' THEN tier IN ('pro', 'pioneer', 'enterprise', 'elder', 'blood_brotherhood')
                    ELSE true
                END
            )
        ) OR
        EXISTS (
            SELECT 1 FROM public.vault_unlocks 
            WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) 
            AND media_id = vault_media.id
        )
    )
);

CREATE POLICY "vault_media_admin_all" ON public.vault_media
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND (role = 'admin' OR role = 'super_admin')
    )
    OR 
    auth.jwt() ->> 'email' = 'info@eriggalive.com'
);

-- Create vault_unlocks table to track premium content unlocks
CREATE TABLE IF NOT EXISTS public.vault_unlocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.vault_media(id) ON DELETE CASCADE,
    unlock_method TEXT CHECK (unlock_method IN ('coins', 'payment', 'tier')),
    amount_paid INTEGER,
    currency TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, media_id)
);

-- Enable RLS for vault_unlocks
ALTER TABLE public.vault_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_unlocks_user_own" ON public.vault_unlocks
FOR ALL
USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    send_to_all BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_user_own" ON public.notifications
FOR SELECT
USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
    (send_to_all = true AND auth.uid() IS NOT NULL)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_live_streams_updated_at ON public.live_streams;
CREATE TRIGGER update_live_streams_updated_at 
    BEFORE UPDATE ON public.live_streams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vault_media_updated_at ON public.vault_media;
CREATE TRIGGER update_vault_media_updated_at 
    BEFORE UPDATE ON public.vault_media 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
