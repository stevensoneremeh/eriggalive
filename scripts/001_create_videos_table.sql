-- Create videos table for streaming content
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view videos (public read access)
CREATE POLICY "Allow public read access" ON public.videos
  FOR SELECT
  USING (true);
