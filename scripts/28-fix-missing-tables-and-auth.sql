-- Create missing cartoon_series table for chronicles
CREATE TABLE IF NOT EXISTS public.cartoon_series (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    total_episodes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    release_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cartoon_episodes table
CREATE TABLE IF NOT EXISTS public.cartoon_episodes (
    id BIGSERIAL PRIMARY KEY,
    series_id BIGINT REFERENCES public.cartoon_series(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    episode_number INTEGER NOT NULL,
    video_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample cartoon series data
INSERT INTO public.cartoon_series (title, description, thumbnail_url, total_episodes, status, release_date) VALUES
('Erigga Chronicles: The Beginning', 'Follow Erigga''s journey from the streets of Warri to becoming a music legend', '/placeholder.svg?height=300&width=400', 12, 'active', '2024-01-01'),
('Paper Boi Adventures', 'Animated adventures of Paper Boi and his crew in the South-South', '/placeholder.svg?height=300&width=400', 8, 'active', '2024-02-15'),
('Warri Stories', 'Tales from the streets of Warri featuring local legends and folklore', '/placeholder.svg?height=300&width=400', 15, 'active', '2024-03-01'),
('Music Legends', 'Animated biographies of Nigerian music legends', '/placeholder.svg?height=300&width=400', 10, 'coming_soon', '2024-06-01')
ON CONFLICT DO NOTHING;

-- Ensure community_categories table exists with proper data
CREATE TABLE IF NOT EXISTS public.community_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert community categories
INSERT INTO public.community_categories (name, slug, description, display_order, is_active) VALUES
('General Discussion', 'general', 'General conversations and discussions', 1, true),
('Music & Lyrics', 'music', 'Share and discuss music, lyrics, and bars', 2, true),
('Events & Shows', 'events', 'Upcoming events, concerts, and shows', 3, true),
('Freestyle Corner', 'freestyle', 'Share your freestyle bars and rap skills', 4, true),
('Fan Art', 'art', 'Share your creative artwork and fan creations', 5, true),
('News & Updates', 'news', 'Latest news and updates from the community', 6, true),
('Community Support', 'support', 'Get help and support from the community', 7, true)
ON CONFLICT (slug) DO NOTHING;

-- Fix RLS policies for better access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all cartoon series" ON public.cartoon_series;
DROP POLICY IF EXISTS "Users can view all cartoon episodes" ON public.cartoon_episodes;
DROP POLICY IF EXISTS "Users can view community categories" ON public.community_categories;

-- Enable RLS
ALTER TABLE public.cartoon_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoon_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for public content
CREATE POLICY "Anyone can view cartoon series" ON public.cartoon_series
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view cartoon episodes" ON public.cartoon_episodes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view community categories" ON public.community_categories
    FOR SELECT USING (true);

-- Update users table RLS policies to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- More permissive user policies
CREATE POLICY "Authenticated users can view users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = auth_user_id);

-- Ensure community posts and related tables have proper policies
DROP POLICY IF EXISTS "Users can view published posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;

CREATE POLICY "Anyone can view published posts" ON public.community_posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

CREATE POLICY "Authenticated users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own posts" ON public.community_posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = community_posts.user_id 
            AND users.auth_user_id = auth.uid()::text
        )
    );

-- Fix community comments policies
DROP POLICY IF EXISTS "Users can view comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.community_comments;

CREATE POLICY "Anyone can view comments" ON public.community_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" ON public.community_comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = community_comments.user_id 
            AND users.auth_user_id = auth.uid()::text
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cartoon_series_status ON public.cartoon_series(status);
CREATE INDEX IF NOT EXISTS idx_cartoon_episodes_series_id ON public.cartoon_episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_community_categories_active ON public.community_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- Update function to handle post votes with better error handling
CREATE OR REPLACE FUNCTION public.handle_post_vote(
    p_post_id BIGINT,
    p_voter_auth_id TEXT,
    p_post_creator_auth_id TEXT,
    p_coin_amount INTEGER DEFAULT 100
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voter_id BIGINT;
    v_post_creator_id BIGINT;
    v_voter_coins INTEGER;
    v_existing_vote BOOLEAN := FALSE;
BEGIN
    -- Get voter's internal ID
    SELECT id, coins INTO v_voter_id, v_voter_coins
    FROM public.users 
    WHERE auth_user_id = p_voter_auth_id;
    
    IF v_voter_id IS NULL THEN
        RAISE EXCEPTION 'Voter not found';
    END IF;
    
    -- Get post creator's internal ID
    SELECT id INTO v_post_creator_id
    FROM public.users 
    WHERE auth_user_id = p_post_creator_auth_id;
    
    IF v_post_creator_id IS NULL THEN
        RAISE EXCEPTION 'Post creator not found';
    END IF;
    
    -- Check if trying to vote on own post
    IF v_voter_id = v_post_creator_id THEN
        RAISE EXCEPTION 'Cannot vote on own post';
    END IF;
    
    -- Check if already voted
    SELECT TRUE INTO v_existing_vote
    FROM public.community_post_votes
    WHERE post_id = p_post_id AND user_id = v_voter_id;
    
    IF v_existing_vote THEN
        RAISE EXCEPTION 'Already voted on this post';
    END IF;
    
    -- Check if voter has enough coins
    IF v_voter_coins < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;
    
    -- Perform the vote transaction
    BEGIN
        -- Deduct coins from voter
        UPDATE public.users 
        SET coins = coins - p_coin_amount
        WHERE id = v_voter_id;
        
        -- Add coins to post creator
        UPDATE public.users 
        SET coins = coins + p_coin_amount
        WHERE id = v_post_creator_id;
        
        -- Record the vote
        INSERT INTO public.community_post_votes (post_id, user_id)
        VALUES (p_post_id, v_voter_id);
        
        -- Update post vote count
        UPDATE public.community_posts 
        SET vote_count = vote_count + 1
        WHERE id = p_post_id;
        
        -- Create coin transaction records
        INSERT INTO public.coin_transactions (user_id, amount, transaction_type, status, description, currency, exchange_rate)
        VALUES 
        (v_voter_id, -p_coin_amount, 'content_access', 'completed', 'Voted on post #' || p_post_id, 'NGN', 1),
        (v_post_creator_id, p_coin_amount, 'reward', 'completed', 'Received vote on post #' || p_post_id, 'NGN', 1);
        
        RETURN TRUE;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Vote transaction failed: %', SQLERRM;
    END;
END;
$$;
