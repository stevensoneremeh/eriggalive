-- Enhanced posts table with multimedia support and voting
CREATE TABLE IF NOT EXISTS public.community_posts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 5000),
    post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'media', 'announcement', 'event')),
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}',
    thumbnail_urls TEXT[] DEFAULT '{}',
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),
    coin_votes INTEGER DEFAULT 0 CHECK (coin_votes >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments with threading support
CREATE TABLE IF NOT EXISTS public.community_comments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 2000),
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}',
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),
    coin_votes INTEGER DEFAULT 0 CHECK (coin_votes >= 0),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post votes with coin support
CREATE TABLE IF NOT EXISTS public.community_post_votes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote', 'coin')),
    coins_spent INTEGER DEFAULT 0 CHECK (coins_spent >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, vote_type)
);

-- Comment votes with coin support
CREATE TABLE IF NOT EXISTS public.community_comment_votes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    comment_id BIGINT NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote', 'coin')),
    coins_spent INTEGER DEFAULT 0 CHECK (coins_spent >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id, vote_type)
);

-- Categories for organizing community posts
CREATE TABLE IF NOT EXISTS public.community_categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    parent_id BIGINT REFERENCES public.community_categories(id) ON DELETE SET NULL,
    post_count INTEGER DEFAULT 0 CHECK (post_count >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    required_tier TEXT DEFAULT 'grassroot' CHECK (required_tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media uploads tracking
CREATE TABLE IF NOT EXISTS public.community_media (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id BIGINT REFERENCES public.community_posts(id) ON DELETE CASCADE,
    comment_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document')),
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id ON public.community_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON public.community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON public.community_post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_votes_comment_id ON public.community_comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_votes_user_id ON public.community_comment_votes(user_id);

-- Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, color, required_tier, display_order) VALUES
('General Discussion', 'general-discussion', 'General discussions about Erigga and his music', 'MessageSquare', '#3B82F6', 'grassroot', 1),
('Music & Lyrics', 'music-lyrics', 'Discuss Erigga''s music, lyrics, and their meanings', 'Music', '#EC4899', 'grassroot', 2),
('Events & Shows', 'events-shows', 'Information about upcoming events and shows', 'Calendar', '#10B981', 'grassroot', 3),
('Freestyle Corner', 'freestyle-corner', 'Share your own freestyle lyrics and get feedback', 'Mic', '#F59E0B', 'grassroot', 4),
('Premium Lounge', 'premium-lounge', 'Exclusive discussions for premium members', 'Crown', '#8B5CF6', 'pioneer', 5),
('Elder''s Council', 'elders-council', 'Strategic discussions for Elder tier members', 'Shield', '#6366F1', 'elder', 6),
('Blood Brotherhood', 'blood-brotherhood', 'Inner circle discussions for Blood tier members', 'Droplet', '#EF4444', 'blood', 7);

-- Add RLS policies
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_media ENABLE ROW LEVEL SECURITY;

-- Everyone can read posts and comments
CREATE POLICY "Anyone can read posts" ON public.community_posts
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read comments" ON public.community_comments
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read categories" ON public.community_categories
    FOR SELECT USING (true);

-- Only authenticated users can create posts and comments
CREATE POLICY "Authenticated users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only update or delete their own posts and comments
CREATE POLICY "Users can update their own posts" ON public.community_posts
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM public.users WHERE id = user_id
        )
    );

CREATE POLICY "Users can delete their own posts" ON public.community_posts
    FOR DELETE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM public.users WHERE id = user_id
        )
    );

CREATE POLICY "Users can update their own comments" ON public.community_comments
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM public.users WHERE id = user_id
        )
    );

CREATE POLICY "Users can delete their own comments" ON public.community_comments
    FOR DELETE USING (
        auth.uid() IN (
            SELECT auth_user_id FROM public.users WHERE id = user_id
        )
    );

-- Voting policies
CREATE POLICY "Authenticated users can vote" ON public.community_post_votes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can read votes" ON public.community_post_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on comments" ON public.community_comment_votes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can read comment votes" ON public.community_comment_votes
    FOR SELECT USING (true);

-- Media upload policies
CREATE POLICY "Authenticated users can upload media" ON public.community_media
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can read media" ON public.community_media
    FOR SELECT USING (true);
