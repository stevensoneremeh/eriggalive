
-- Page Content Management System
CREATE TABLE IF NOT EXISTS public.page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name TEXT NOT NULL CHECK (page_name IN ('homepage', 'about', 'events', 'merch', 'vault', 'radio', 'community', 'chronicles', 'coins', 'premium')),
  page_title TEXT,
  section_type TEXT NOT NULL CHECK (section_type IN ('hero', 'featured', 'about', 'services', 'gallery', 'cta', 'testimonials', 'faq', 'custom')),
  title TEXT NOT NULL,
  subtitle TEXT,
  content_text TEXT,
  image_url TEXT,
  video_url TEXT,
  button_text TEXT,
  button_link TEXT,
  section_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  custom_css TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_content_page_name ON public.page_content(page_name);
CREATE INDEX IF NOT EXISTS idx_page_content_active ON public.page_content(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_page_content_order ON public.page_content(page_name, section_order);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to active content" ON public.page_content
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin full access to content" ON public.page_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'info@eriggalive.com'
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW
  EXECUTE FUNCTION update_page_content_updated_at();

-- Grant permissions
GRANT SELECT ON public.page_content TO anon, authenticated;
GRANT ALL ON public.page_content TO authenticated;
