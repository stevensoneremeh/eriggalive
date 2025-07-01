-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('confirmed', 'pending', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('video', 'audio', 'image');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('bars', 'story', 'event', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE album_type AS ENUM ('album', 'ep', 'mixtape', 'single');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('purchase', 'withdrawal', 'reward', 'content_access');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('paystack', 'crypto', 'coins');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id bigint primary key generated always as identity,
    auth_user_id text unique not null,
    username text unique not null,
    full_name text not null,
    avatar_url text,
    tier user_tier default 'grassroot',
    level integer default 1,
    points integer default 0,
    coins integer default 0,
    erigga_id text unique,
    bio text,
    location text,
    wallet_address text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create function to generate erigga_id
CREATE OR REPLACE FUNCTION generate_erigga_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.erigga_id := 'EG' || LPAD(NEW.id::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for erigga_id generation
DROP TRIGGER IF EXISTS generate_erigga_id_trigger ON public.users;
CREATE TRIGGER generate_erigga_id_trigger
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION generate_erigga_id();

-- Create albums table
CREATE TABLE IF NOT EXISTS public.albums (
    id bigint primary key generated always as identity,
    title text NOT NULL,
    description text,
    cover_url text NOT NULL,
    type album_type DEFAULT 'album',
    release_date date NOT NULL,
    total_tracks integer DEFAULT 0,
    duration text,
    is_premium boolean DEFAULT false,
    required_tier user_tier DEFAULT 'grassroot',
    coin_price integer DEFAULT 0,
    play_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
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
    required_tier user_tier DEFAULT 'grassroot',
    coin_price integer DEFAULT 0,
    play_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    release_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (album_id) REFERENCES public.albums (id) ON DELETE SET NULL
);

-- Create streaming_links table
CREATE TABLE IF NOT EXISTS public.streaming_links (
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

-- Create music_videos table
CREATE TABLE IF NOT EXISTS public.music_videos (
    id bigint primary key generated always as identity,
    track_id bigint,
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text NOT NULL,
    duration text NOT NULL,
    views integer DEFAULT 0,
    is_premium boolean DEFAULT false,
    required_tier user_tier DEFAULT 'grassroot',
    coin_price integer DEFAULT 0,
    release_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (track_id) REFERENCES public.tracks (id) ON DELETE SET NULL
);

-- Create gallery_items table
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id bigint primary key generated always as identity,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    category text NOT NULL,
    is_premium boolean DEFAULT false,
    required_tier user_tier DEFAULT 'grassroot',
    coin_price integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create coin_transactions table
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id bigint primary key generated always as identity,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    transaction_type transaction_type NOT NULL,
    payment_method payment_method,
    reference_id text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create content_access table
CREATE TABLE IF NOT EXISTS public.content_access (
    id bigint primary key generated always as identity,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_type text NOT NULL,
    content_id bigint NOT NULL,
    coins_spent integer NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id bigint primary key generated always as identity,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    type post_type DEFAULT 'general',
    media_url text,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id bigint primary key generated always as identity,
    post_id bigint NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
    id bigint primary key generated always as identity,
    post_id bigint NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id bigint primary key generated always as identity,
    title text NOT NULL,
    description text,
    venue text NOT NULL,
    location text NOT NULL,
    date timestamp with time zone NOT NULL,
    ticket_price decimal(10,2) NOT NULL,
    max_tickets integer NOT NULL,
    tickets_sold integer DEFAULT 0,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id bigint primary key generated always as identity,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id bigint NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    ticket_number text UNIQUE NOT NULL,
    qr_code text NOT NULL,
    status ticket_status DEFAULT 'pending',
    payment_reference text NOT NULL,
    amount_paid decimal(10,2) NOT NULL,
    purchased_at timestamp with time zone DEFAULT now(),
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id bigint primary key generated always as identity,
    name text NOT NULL,
    description text,
    price decimal(10,2) NOT NULL,
    images text[] DEFAULT '{}',
    sizes text[] DEFAULT '{}',
    category text,
    is_premium_only boolean DEFAULT false,
    coin_price integer DEFAULT 0,
    stock_quantity integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create media_content table
CREATE TABLE IF NOT EXISTS public.media_content (
    id bigint primary key generated always as identity,
    title text NOT NULL,
    description text,
    type content_type NOT NULL,
    file_url text NOT NULL,
    thumbnail_url text,
    duration integer,
    is_premium boolean DEFAULT false,
    required_tier user_tier DEFAULT 'grassroot',
    coin_price integer DEFAULT 0,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users (tier);
CREATE INDEX IF NOT EXISTS idx_albums_release_date ON public.albums (release_date DESC);
CREATE INDEX IF NOT EXISTS idx_albums_type ON public.albums (type);
CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON public.tracks (album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_release_date ON public.tracks (release_date DESC);
CREATE INDEX IF NOT EXISTS idx_streaming_links_track_id ON public.streaming_links (track_id);
CREATE INDEX IF NOT EXISTS idx_streaming_links_album_id ON public.streaming_links (album_id);
CREATE INDEX IF NOT EXISTS idx_music_videos_track_id ON public.music_videos (track_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_category ON public.gallery_items (category);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_status ON public.coin_transactions (status);
CREATE INDEX IF NOT EXISTS idx_content_access_user_id ON public.content_access (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events (date);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaming_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view and update their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = auth_user_id);

-- Public content policies
CREATE POLICY "Albums are viewable by everyone" ON public.albums
    FOR SELECT USING (true);

CREATE POLICY "Tracks are viewable by everyone" ON public.tracks
    FOR SELECT USING (true);

CREATE POLICY "Streaming links are viewable by everyone" ON public.streaming_links
    FOR SELECT USING (true);

CREATE POLICY "Music videos are viewable by everyone" ON public.music_videos
    FOR SELECT USING (true);

CREATE POLICY "Gallery items are viewable by everyone" ON public.gallery_items
    FOR SELECT USING (true);

CREATE POLICY "Events are viewable by everyone" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Media content is viewable by everyone" ON public.media_content
    FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can view their own transactions" ON public.coin_transactions
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert their own transactions" ON public.coin_transactions
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can view their own content access" ON public.content_access
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert their own content access" ON public.content_access
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Posts are viewable by everyone" ON public.posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can view their own tickets" ON public.tickets
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can purchase tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_music_videos_updated_at BEFORE UPDATE ON public.music_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coin_transactions_updated_at BEFORE UPDATE ON public.coin_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_content_updated_at BEFORE UPDATE ON public.media_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
