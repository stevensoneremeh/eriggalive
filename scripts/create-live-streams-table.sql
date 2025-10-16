
-- Create live_streams table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    mux_playback_id TEXT,
    mux_stream_key TEXT,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'scheduled')),
    is_active BOOLEAN DEFAULT FALSE,
    is_live BOOLEAN DEFAULT FALSE,
    viewer_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to live streams"
    ON public.live_streams
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated users to insert live streams"
    ON public.live_streams
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update their own live streams"
    ON public.live_streams
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON public.live_streams(status, is_active);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_at ON public.live_streams(created_at DESC);
