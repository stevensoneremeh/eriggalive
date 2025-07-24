-- =====================================================
-- ERIGGA LIVE - WORKING DATABASE SETUP
-- =====================================================
-- This file contains the working database setup based on your successful implementation

-- 1. ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREATE USERS TABLE (LINKED TO AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
    coins_balance INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE COMMUNITY CATEGORIES
CREATE TABLE IF NOT EXISTS public.community_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT '💬',
    color VARCHAR(7) DEFAULT '#3B82F6',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS public.community_posts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES public.community_categories(id),
    title VARCHAR(500),
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE COMMUNITY COMMENTS
CREATE TABLE IF NOT EXISTS public.community_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. YOUR WORKING COMMUNITY VOTES TABLE
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_votes') THEN 
        CREATE TABLE public.community_votes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            post_id INTEGER NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
            vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, post_id)
        );
    END IF;
END $$;

-- Enable RLS on community_votes
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

-- Policies for community_votes
DROP POLICY IF EXISTS "Users can create votes" ON public.community_votes;
DROP POLICY IF EXISTS "Users can only vote once per post" ON public.community_votes;

CREATE POLICY "Users can create votes" 
    ON public.community_votes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only vote once per post" 
    ON public.community_votes FOR ALL 
    USING (
        (SELECT COUNT(*) FROM public.community_votes 
         WHERE user_id = auth.uid() AND post_id = community_votes.post_id) <= 1
    );

-- Create an index to improve performance of vote uniqueness check
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_votes_user_post 
ON public.community_votes (user_id, post_id);

-- 7. CREATE OTHER ESSENTIAL TABLES
CREATE TABLE IF NOT EXISTS public.user_follows (
    id SERIAL PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('post_like', 'comment_like', 'comment_reply', 'follow', 'mention', 'system', 'achievement')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    actor_id UUID REFERENCES public.users(auth_user_id) ON DELETE SET NULL,
    related_post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE,
    related_comment_id INTEGER REFERENCES public.community_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'earned', 'spent', 'refund', 'bonus')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meet_greet_sessions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    tier_required VARCHAR(50) NOT NULL CHECK (tier_required IN ('grassroot', 'pioneer', 'elder', 'blood')),
    coin_cost INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
    meeting_link TEXT,
    created_by UUID REFERENCES public.users(auth_user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meet_greet_bookings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.meet_greet_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    coins_paid INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show')),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- 8. ENABLE RLS ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_greet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_greet_bookings ENABLE ROW LEVEL SECURITY;

-- 9. CREATE BASIC RLS POLICIES
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can view categories" ON public.community_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view published posts" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON public.community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. INSERT DEFAULT CATEGORIES
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General discussions about Erigga and music', '💬', '#3B82F6', 1),
('Music & Lyrics', 'music', 'Discuss Erigga''s music, lyrics, and songs', '🎵', '#10B981', 2),
('Events & Concerts', 'events', 'Upcoming events, concerts, and performances', '🎤', '#F59E0B', 3),
('Fan Art & Creativity', 'fan-art', 'Share your creative works and fan art', '🎨', '#8B5CF6', 4),
('News & Updates', 'news', 'Latest news and updates about Erigga', '📰', '#EF4444', 5),
('Meet & Greet', 'meet-greet', 'Discussions about meet and greet sessions', '🤝', '#06B6D4', 6)
ON CONFLICT (name) DO NOTHING;

-- 11. CREATE FUNCTION TO HANDLE NEW USER REGISTRATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, username, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. CREATE TRIGGER FOR NEW USER REGISTRATION
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- This is your working database setup with the community_votes table
-- that you confirmed is working successfully.
-- =====================================================
