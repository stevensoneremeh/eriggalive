-- Enhanced Admin Features Schema
-- Adds support for: Live Streaming (Mux), Meet & Greet (Daily.co), Homepage Media

-- Live Streams table (for Mux audio/video streams)
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  stream_type TEXT CHECK (stream_type IN ('audio', 'video')) DEFAULT 'audio',
  mux_playback_id TEXT,
  mux_stream_key TEXT,
  mux_asset_id TEXT,
  status TEXT CHECK (status IN ('idle', 'active', 'ended')) DEFAULT 'idle',
  is_active BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  viewer_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Meet and Greet bookings
CREATE TABLE IF NOT EXISTS public.meet_greet_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 15,
  status TEXT CHECK (status IN ('pending', 'paid', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_reference TEXT,
  payment_amount DECIMAL(10,2),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  daily_room_name TEXT,
  daily_room_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Homepage media (hero section)
CREATE TABLE IF NOT EXISTS public.homepage_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  section TEXT DEFAULT 'hero',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  link_url TEXT,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enhanced vault_items table (if doesn't exist)
CREATE TABLE IF NOT EXISTS public.vault_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT CHECK (media_type IN ('video', 'audio', 'image', 'document')) NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'vault',
  tier_required TEXT CHECK (tier_required IN ('grassroot', 'pioneer', 'elder', 'blood')),
  duration INTEGER,
  file_size BIGINT,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_live_streams_updated_at ON public.live_streams;
CREATE TRIGGER update_live_streams_updated_at BEFORE UPDATE ON public.live_streams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meet_greet_bookings_updated_at ON public.meet_greet_bookings;
CREATE TRIGGER update_meet_greet_bookings_updated_at BEFORE UPDATE ON public.meet_greet_bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_homepage_media_updated_at ON public.homepage_media;
CREATE TRIGGER update_homepage_media_updated_at BEFORE UPDATE ON public.homepage_media 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vault_items_updated_at ON public.vault_items;
CREATE TRIGGER update_vault_items_updated_at BEFORE UPDATE ON public.vault_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_greet_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_streams
CREATE POLICY "Anyone can view active live streams" ON public.live_streams 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage live streams" ON public.live_streams 
  FOR ALL USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

-- RLS Policies for meet_greet_bookings
CREATE POLICY "Users can view own bookings" ON public.meet_greet_bookings 
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Users can create bookings" ON public.meet_greet_bookings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all bookings" ON public.meet_greet_bookings 
  FOR ALL USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

-- RLS Policies for homepage_media
CREATE POLICY "Anyone can view active homepage media" ON public.homepage_media 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage homepage media" ON public.homepage_media 
  FOR ALL USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

-- RLS Policies for vault_items
CREATE POLICY "Users can view vault items based on tier" ON public.vault_items 
  FOR SELECT USING (
    is_active = true AND (
      tier_required IS NULL OR
      tier_required = 'grassroot' OR
      auth.jwt() ->> 'email' = 'info@eriggalive.com' OR
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND (
          (tier_required = 'pioneer' AND tier IN ('pioneer', 'elder', 'blood')) OR
          (tier_required = 'elder' AND tier IN ('elder', 'blood')) OR
          (tier_required = 'blood' AND tier = 'blood')
        )
      )
    )
  );

CREATE POLICY "Admin can manage vault items" ON public.vault_items 
  FOR ALL USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

-- Grant permissions
GRANT ALL ON public.live_streams TO authenticated;
GRANT ALL ON public.meet_greet_bookings TO authenticated;
GRANT ALL ON public.homepage_media TO authenticated;
GRANT ALL ON public.vault_items TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON public.live_streams(status, is_active);
CREATE INDEX IF NOT EXISTS idx_meet_greet_bookings_user ON public.meet_greet_bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_homepage_media_active ON public.homepage_media(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_vault_items_tier ON public.vault_items(tier_required, is_active);
