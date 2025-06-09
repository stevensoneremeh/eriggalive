-- Create albums table
CREATE TABLE public.albums (
   id bigint primary key generated always as identity,
   title text NOT NULL,
   description text,
   cover_url text NOT NULL,
   type text DEFAULT 'album' CHECK (type IN ('album', 'ep', 'mixtape', 'single')),
   release_date date NOT NULL,
   total_tracks integer DEFAULT 0,
   duration text,
   is_premium boolean DEFAULT false,
   required_tier text DEFAULT 'street_rep' CHECK (required_tier IN ('street_rep', 'warri_elite', 'erigma_circle')),
   play_count integer DEFAULT 0,
   like_count integer DEFAULT 0,
   created_at timestamp with time zone DEFAULT now(),
   updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Create tracks table
CREATE TABLE public.tracks (
   id bigint primary key generated always as identity,
   album_id bigint,
   title text NOT NULL,
   artist text NOT NULL DEFAULT 'Erigga',
   featuring text,
   duration text NOT NULL,
   track_number integer,
   lyrics text,
   cover_url text,
   audio_url text,
   is_premium boolean DEFAULT false,
   required_tier text DEFAULT 'street_rep' CHECK (required_tier IN ('street_rep', 'warri_elite', 'erigma_circle')),
   play_count integer DEFAULT 0,
   like_count integer DEFAULT 0,
   release_date date NOT NULL,
   created_at timestamp with time zone DEFAULT now(),
   updated_at timestamp with time zone DEFAULT now(),
   FOREIGN KEY (album_id) REFERENCES public.albums (id) ON DELETE SET NULL
);
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Create streaming_links table
CREATE TABLE public.streaming_links (
   id bigint primary key generated always as identity,
   track_id bigint,
   album_id bigint,
   platform text NOT NULL,
   url text NOT NULL,
   created_at timestamp with time zone DEFAULT now(),
   FOREIGN KEY (track_id) REFERENCES public.tracks (id) ON DELETE CASCADE,
   FOREIGN KEY (album_id) REFERENCES public.albums (id) ON DELETE CASCADE,
   CHECK ((track_id IS NOT NULL) OR (album_id IS NOT NULL))
);
ALTER TABLE public.streaming_links ENABLE ROW LEVEL SECURITY;

-- Create music_videos table
CREATE TABLE public.music_videos (
   id bigint primary key generated always as identity,
   track_id bigint,
   title text NOT NULL,
   description text,
   video_url text NOT NULL,
   thumbnail_url text NOT NULL,
   duration text NOT NULL,
   views integer DEFAULT 0,
   is_premium boolean DEFAULT false,
   required_tier text DEFAULT 'street_rep' CHECK (required_tier IN ('street_rep', 'warri_elite', 'erigma_circle')),
   release_date date NOT NULL,
   created_at timestamp with time zone DEFAULT now(),
   updated_at timestamp with time zone DEFAULT now(),
   FOREIGN KEY (track_id) REFERENCES public.tracks (id) ON DELETE SET NULL
);
ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;

-- Create gallery_items table
CREATE TABLE public.gallery_items (
   id bigint primary key generated always as identity,
   title text NOT NULL,
   description text,
   image_url text NOT NULL,
   category text NOT NULL,
   is_premium boolean DEFAULT false,
   required_tier text DEFAULT 'street_rep' CHECK (required_tier IN ('street_rep', 'warri_elite', 'erigma_circle')),
   created_at timestamp with time zone DEFAULT now(),
   updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_albums_release_date ON public.albums (release_date DESC);
CREATE INDEX idx_albums_type ON public.albums (type);
CREATE INDEX idx_tracks_album_id ON public.tracks (album_id);
CREATE INDEX idx_tracks_release_date ON public.tracks (release_date DESC);
CREATE INDEX idx_streaming_links_track_id ON public.streaming_links (track_id);
CREATE INDEX idx_streaming_links_album_id ON public.streaming_links (album_id);
CREATE INDEX idx_music_videos_track_id ON public.music_videos (track_id);
CREATE INDEX idx_gallery_items_category ON public.gallery_items (category);

-- Create RLS policies
-- Albums are public but premium content requires tier
CREATE POLICY select_albums ON public.albums
FOR SELECT
USING (is_premium = false OR (is_premium = true AND required_tier = (SELECT tier FROM public.users WHERE auth_user_id = auth.uid())));

-- Tracks are public but premium content requires tier
CREATE POLICY select_tracks ON public.tracks
FOR SELECT
USING (is_premium = false OR (is_premium = true AND required_tier = (SELECT tier FROM public.users WHERE auth_user_id = auth.uid())));

-- Streaming links are public
CREATE POLICY select_streaming_links ON public.streaming_links
FOR SELECT
USING (true);

-- Music videos are public but premium content requires tier
CREATE POLICY select_music_videos ON public.music_videos
FOR SELECT
USING (is_premium = false OR (is_premium = true AND required_tier = (SELECT tier FROM public.users WHERE auth_user_id = auth.uid())));

-- Gallery items are public but premium content requires tier
CREATE POLICY select_gallery_items ON public.gallery_items
FOR SELECT
USING (is_premium = false OR (is_premium = true AND required_tier = (SELECT tier FROM public.users WHERE auth_user_id = auth.uid())));

-- Admin insert policies (Warri Elite and Erigma Circle can upload)
CREATE POLICY insert_albums ON public.albums
FOR INSERT
WITH CHECK ((SELECT tier FROM public.users WHERE auth_user_id = auth.uid()) IN ('warri_elite', 'erigma_circle'));

CREATE POLICY insert_tracks ON public.tracks
FOR INSERT
WITH CHECK ((SELECT tier FROM public.users WHERE auth_user_id = auth.uid()) IN ('warri_elite', 'erigma_circle'));

CREATE POLICY insert_streaming_links ON public.streaming_links
FOR INSERT
WITH CHECK ((SELECT tier FROM public.users WHERE auth_user_id = auth.uid()) IN ('warri_elite', 'erigma_circle'));

CREATE POLICY insert_music_videos ON public.music_videos
FOR INSERT
WITH CHECK ((SELECT tier FROM public.users WHERE auth_user_id = auth.uid()) IN ('warri_elite', 'erigma_circle'));

CREATE POLICY insert_gallery_items ON public.gallery_items
FOR INSERT
WITH CHECK ((SELECT tier FROM public.users WHERE auth_user_id = auth.uid()) IN ('warri_elite', 'erigma_circle'));

-- Insert sample data
INSERT INTO public.albums (title, description, cover_url, type, release_date, total_tracks, duration, is_premium, play_count) VALUES
('The Erigma', 'The breakthrough album that established Erigga as the Paper Boi', 'https://images.genius.com/b8a7a7c8f8e8a7a7c8f8e8a7a7c8f8e8.1000x1000x1.jpg', 'album', '2019-02-14', 17, '1:02:45', false, 2500000),
('The Erigma II', 'The highly anticipated sequel featuring collaborations with top artists', 'https://images.genius.com/8c7b6a5d4e3f2a1b9c8d7e6f5a4b3c2d.1000x1000x1.jpg', 'album', '2020-10-30', 15, '58:32', false, 3200000),
('Street Motivation', 'Raw street stories and motivational tracks', 'https://images.genius.com/f5e4d3c2b1a9f8e7d6c5b4a3f2e1d0c9.1000x1000x1.jpg', 'mixtape', '2021-06-15', 12, '45:18', true, 1800000);

INSERT INTO public.tracks (title, artist, featuring, duration, cover_url, release_date, play_count, is_premium) VALUES
('Send Her Money', 'Erigga', 'Yemi Alade', '3:45', 'https://images.genius.com/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.1000x1000x1.jpg', '2023-08-15', 5200000, false),
('The Fear of God', 'Erigga', NULL, '4:12', 'https://images.genius.com/b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7.1000x1000x1.jpg', '2023-03-20', 3800000, false),
('Area to the World', 'Erigga', 'Zlatan', '3:28', 'https://images.genius.com/c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8.1000x1000x1.jpg', '2022-12-10', 4100000, true);

INSERT INTO public.streaming_links (track_id, platform, url) VALUES
(1, 'spotify', 'https://open.spotify.com/track/send-her-money'),
(1, 'apple_music', 'https://music.apple.com/track/send-her-money'),
(1, 'audiomack', 'https://audiomack.com/erigga/song/send-her-money'),
(2, 'spotify', 'https://open.spotify.com/track/fear-of-god'),
(2, 'youtube_music', 'https://music.youtube.com/track/fear-of-god'),
(3, 'audiomack', 'https://audiomack.com/erigga/song/area-to-the-world');

INSERT INTO public.music_videos (title, thumbnail_url, duration, views, release_date, is_premium) VALUES
('Send Her Money (Official Video)', 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '4:15', 8500000, '2023-08-20', false),
('The Fear of God (Official Video)', 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '4:42', 6200000, '2023-03-25', false),
('Paper Boi (Behind The Scenes)', 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '8:30', 1200000, '2023-01-15', true);

INSERT INTO public.gallery_items (title, image_url, category, is_premium) VALUES
('Studio Session', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', 'Behind The Scenes', false),
('Concert Performance', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', 'Live Shows', false),
('Album Cover Shoot', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800', 'Photoshoot', true);
