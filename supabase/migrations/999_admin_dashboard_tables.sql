-- Admin Dashboard Tables
-- Creates all tables needed for the admin dashboard MVP

-- Homepage content management
CREATE TABLE IF NOT EXISTS public.homepage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  section_type TEXT CHECK (section_type IN ('hero', 'featured', 'announcement', 'about')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Merch/Products management
CREATE TABLE IF NOT EXISTS public.merch (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Media management (images, audio)
CREATE TABLE IF NOT EXISTS public.media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('image', 'audio', 'video')),
  title TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT,
  duration INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Radio stream management
CREATE TABLE IF NOT EXISTS public.radio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  schedule TEXT,
  description TEXT,
  is_live BOOLEAN DEFAULT false,
  listener_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Videos management (Chronicles & Vault)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('chronicles', 'vault', 'exclusive', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  view_count INTEGER DEFAULT 0,
  tier_required TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Subscription tiers management
CREATE TABLE IF NOT EXISTS public.tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  billing_period TEXT DEFAULT 'monthly',
  permissions JSONB DEFAULT '{}'::jsonb,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_homepage_updated_at ON public.homepage;
CREATE TRIGGER update_homepage_updated_at BEFORE UPDATE ON public.homepage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_merch_updated_at ON public.merch;
CREATE TRIGGER update_merch_updated_at BEFORE UPDATE ON public.merch FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_updated_at ON public.media;
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_radio_updated_at ON public.radio;
CREATE TRIGGER update_radio_updated_at BEFORE UPDATE ON public.radio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tiers_updated_at ON public.tiers;
CREATE TRIGGER update_tiers_updated_at BEFORE UPDATE ON public.tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.homepage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all users to read, but only info@eriggalive.com can write
-- Read policies (public can read active content)
CREATE POLICY "Anyone can view active homepage content" ON public.homepage FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active merch" ON public.merch FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view media" ON public.media FOR SELECT USING (true);
CREATE POLICY "Anyone can view radio streams" ON public.radio FOR SELECT USING (true);
CREATE POLICY "Anyone can view active videos" ON public.videos FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active tiers" ON public.tiers FOR SELECT USING (is_active = true);

-- Admin write policies (only info@eriggalive.com can write)
CREATE POLICY "Admin can insert homepage content" ON public.homepage FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can update homepage content" ON public.homepage FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can delete homepage content" ON public.homepage FOR DELETE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can insert merch" ON public.merch FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can update merch" ON public.merch FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can delete merch" ON public.merch FOR DELETE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can insert media" ON public.media FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can update media" ON public.media FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can delete media" ON public.media FOR DELETE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can insert radio" ON public.radio FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can update radio" ON public.radio FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can delete radio" ON public.radio FOR DELETE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can insert videos" ON public.videos FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can update videos" ON public.videos FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can delete videos" ON public.videos FOR DELETE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can insert tiers" ON public.tiers FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can update tiers" ON public.tiers FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

CREATE POLICY "Admin can delete tiers" ON public.tiers FOR DELETE
  USING (auth.jwt() ->> 'email' = 'info@eriggalive.com');

-- Insert default tiers
INSERT INTO public.tiers (name, display_name, price, features, display_order) VALUES
  ('grassroot', 'Grassroot', 0, ARRAY['Basic access', 'Community posts', 'Free content'], 0),
  ('pioneer', 'Pioneer', 5000, ARRAY['All Grassroot features', 'Exclusive content', 'Early access'], 1),
  ('elder', 'Elder', 15000, ARRAY['All Pioneer features', 'Live events', 'VIP access'], 2),
  ('blood', 'Blood', 50000, ARRAY['All Elder features', 'Direct access to Erigga', 'Premium perks'], 3)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.homepage TO authenticated;
GRANT ALL ON public.merch TO authenticated;
GRANT ALL ON public.media TO authenticated;
GRANT ALL ON public.radio TO authenticated;
GRANT ALL ON public.videos TO authenticated;
GRANT ALL ON public.tiers TO authenticated;
