-- =====================================================
-- CLEAN SCHEMA FIX - Resolves function conflicts and UUID issues
-- =====================================================

-- Step 1: Drop all existing functions with CASCADE to handle overloads
DROP FUNCTION IF EXISTS public.handle_post_vote CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.update_user_stats CASCADE;
DROP FUNCTION IF EXISTS public.update_comment_counts CASCADE;
DROP FUNCTION IF EXISTS public.update_like_counts CASCADE;

-- Step 2: Drop and recreate tables with proper UUID types
DROP TABLE IF EXISTS public.community_reports CASCADE;
DROP TABLE IF EXISTS public.community_comment_likes CASCADE;
DROP TABLE IF EXISTS public.community_post_votes CASCADE;
DROP TABLE IF EXISTS public.community_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.community_categories CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;
DROP TABLE IF EXISTS public.user_bookmarks CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.coin_transactions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 3: Create users table with proper UUID primary key
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 30),
    full_name TEXT NOT NULL CHECK (length(full_name) >= 2),
    email TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT CHECK (length(bio) <= 500),
    location TEXT,
    tier TEXT DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
    level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    coins BIGINT DEFAULT 1000 CHECK (coins >= 0),
    reputation_score INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0 CHECK (posts_count >= 0),
    followers_count INTEGER DEFAULT 0 CHECK (followers_count >= 0),
    following_count INTEGER DEFAULT 0 CHECK (following_count >= 0),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create community categories with SERIAL (bigint) primary key
CREATE TABLE public.community_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '💬',
    color TEXT DEFAULT '#3B82F6',
    post_count INTEGER DEFAULT 0 CHECK (post_count >= 0),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create community posts with UUID user_id and BIGINT category_id
CREATE TABLE public.community_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES public.community_categories(id) ON DELETE RESTRICT,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 10000),
    hashtags TEXT[] DEFAULT '{}',
    mentions UUID[] DEFAULT '{}',
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')),
    media_metadata JSONB DEFAULT '{}',
    vote_count INTEGER DEFAULT 0 CHECK (vote_count >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create community comments with proper foreign keys
CREATE TABLE public.community_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create voting system with proper types
CREATE TABLE public.community_post_votes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Step 8: Create comment likes with proper types
CREATE TABLE public.community_comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Step 9: Create user follows with UUID types
CREATE TABLE public.user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Step 10: Create notifications with UUID user_id
CREATE TABLE public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('post_vote', 'comment', 'mention', 'follow', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 11: Create coin transactions with UUID user_id
CREATE TABLE public.coin_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'reward', 'vote', 'refund')),
    description TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 12: Create indexes for performance
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_vote_count ON public.community_posts(vote_count DESC);
CREATE INDEX idx_community_posts_hashtags ON public.community_posts USING GIN(hashtags);
CREATE INDEX idx_community_posts_published ON public.community_posts(is_published, is_deleted);

CREATE INDEX idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX idx_community_comments_parent_id ON public.community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_created_at ON public.community_comments(created_at DESC);

CREATE INDEX idx_community_post_votes_post_id ON public.community_post_votes(post_id);
CREATE INDEX idx_community_post_votes_user_id ON public.community_post_votes(user_id);

CREATE INDEX idx_community_comment_likes_comment_id ON public.community_comment_likes(comment_id);
CREATE INDEX idx_community_comment_likes_user_id ON public.community_comment_likes(user_id);

CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Step 13: Create automatic user creation function (single version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (
        auth_user_id,
        username,
        full_name,
        email,
        avatar_url
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth user creation
        RAISE WARNING 'Failed to create user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 14: Create vote handling function with proper parameter types
CREATE OR REPLACE FUNCTION public.handle_post_vote(
    p_post_id BIGINT,
    p_voter_auth_id UUID,
    p_coin_amount INTEGER DEFAULT 100
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    v_voter_id UUID;
    v_post_creator_id UUID;
    v_existing_vote_id BIGINT;
    v_voter_coins BIGINT;
BEGIN
    -- Get voter's ID and coins
    SELECT id, coins INTO v_voter_id, v_voter_coins
    FROM public.users 
    WHERE auth_user_id = p_voter_auth_id;
    
    IF v_voter_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Voter not found');
    END IF;
    
    -- Get post creator's ID
    SELECT user_id INTO v_post_creator_id
    FROM public.community_posts 
    WHERE id = p_post_id AND is_published = true AND is_deleted = false;
    
    IF v_post_creator_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Post not found');
    END IF;
    
    -- Check if voter is trying to vote on their own post
    IF v_voter_id = v_post_creator_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cannot vote on your own post');
    END IF;
    
    -- Check if user has already voted
    SELECT id INTO v_existing_vote_id
    FROM public.community_post_votes 
    WHERE post_id = p_post_id AND user_id = v_voter_id;
    
    IF v_existing_vote_id IS NOT NULL THEN
        -- Remove vote
        DELETE FROM public.community_post_votes WHERE id = v_existing_vote_id;
        
        -- Update post vote count
        UPDATE public.community_posts 
        SET vote_count = GREATEST(vote_count - 1, 0),
            updated_at = NOW()
        WHERE id = p_post_id;
        
        -- Refund coins to voter
        UPDATE public.users 
        SET coins = coins + p_coin_amount,
            updated_at = NOW()
        WHERE id = v_voter_id;
        
        -- Remove coins from post creator
        UPDATE public.users 
        SET coins = GREATEST(coins - p_coin_amount, 0),
            reputation_score = GREATEST(reputation_score - 10, 0),
            updated_at = NOW()
        WHERE id = v_post_creator_id;
        
        -- Record refund transaction
        INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
        VALUES (v_voter_id, p_coin_amount, 'refund', 'Vote removed - refund');
        
        RETURN jsonb_build_object('success', true, 'action', 'removed', 'voted', false);
    ELSE
        -- Check if voter has enough coins
        IF v_voter_coins < p_coin_amount THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient coins');
        END IF;
        
        -- Add vote
        INSERT INTO public.community_post_votes (post_id, user_id)
        VALUES (p_post_id, v_voter_id);
        
        -- Update post vote count
        UPDATE public.community_posts 
        SET vote_count = vote_count + 1,
            updated_at = NOW()
        WHERE id = p_post_id;
        
        -- Transfer coins from voter
        UPDATE public.users 
        SET coins = coins - p_coin_amount,
            updated_at = NOW()
        WHERE id = v_voter_id;
        
        -- Give coins to post creator
        UPDATE public.users 
        SET coins = coins + p_coin_amount,
            reputation_score = reputation_score + 10,
            updated_at = NOW()
        WHERE id = v_post_creator_id;
        
        -- Record transactions
        INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
        VALUES 
        (v_voter_id, -p_coin_amount, 'vote', 'Post vote'),
        (v_post_creator_id, p_coin_amount, 'reward', 'Post vote received');
        
        RETURN jsonb_build_object('success', true, 'action', 'added', 'voted', true);
    END IF;
END;
$$;

-- Step 15: Create stats update function
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_TABLE_NAME = 'community_posts' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE public.users SET posts_count = posts_count + 1, updated_at = NOW() WHERE id = NEW.user_id;
            UPDATE public.community_categories SET post_count = post_count + 1, updated_at = NOW() WHERE id = NEW.category_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.users SET posts_count = GREATEST(posts_count - 1, 0), updated_at = NOW() WHERE id = OLD.user_id;
            UPDATE public.community_categories SET post_count = GREATEST(post_count - 1, 0), updated_at = NOW() WHERE id = OLD.category_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE public.community_posts SET comment_count = comment_count + 1, updated_at = NOW() WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.community_posts SET comment_count = GREATEST(comment_count - 1, 0), updated_at = NOW() WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'user_follows' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE public.users SET following_count = following_count + 1, updated_at = NOW() WHERE id = NEW.follower_id;
            UPDATE public.users SET followers_count = followers_count + 1, updated_at = NOW() WHERE id = NEW.following_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.users SET following_count = GREATEST(following_count - 1, 0), updated_at = NOW() WHERE id = OLD.follower_id;
            UPDATE public.users SET followers_count = GREATEST(followers_count - 1, 0), updated_at = NOW() WHERE id = OLD.following_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 16: Create triggers (drop existing first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_update_post_stats ON public.community_posts;
DROP TRIGGER IF EXISTS trigger_update_comment_stats ON public.community_comments;
DROP TRIGGER IF EXISTS trigger_update_follow_stats ON public.user_follows;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trigger_update_post_stats
    AFTER INSERT OR DELETE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

CREATE TRIGGER trigger_update_comment_stats
    AFTER INSERT OR DELETE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

CREATE TRIGGER trigger_update_follow_stats
    AFTER INSERT OR DELETE ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

-- Step 17: Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Step 18: Create RLS policies (safely)
DO $$
BEGIN
    -- Drop all existing policies to avoid conflicts
    EXECUTE 'DROP POLICY IF EXISTS "Users can view all profiles" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view categories" ON public.community_categories';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view published posts" ON public.community_posts';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts';
    EXECUTE 'DROP POLICY IF EXISTS "Users can edit own posts" ON public.community_posts';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_comments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create comments" ON public.community_comments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can edit own comments" ON public.community_comments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view votes" ON public.community_post_votes';
    EXECUTE 'DROP POLICY IF EXISTS "Users can vote" ON public.community_post_votes';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own votes" ON public.community_post_votes';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows';
    EXECUTE 'DROP POLICY IF EXISTS "Users can follow others" ON public.user_follows';
    EXECUTE 'DROP POLICY IF EXISTS "Users can unfollow" ON public.user_follows';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own transactions" ON public.coin_transactions';
END $$;

-- Create new policies
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can view categories" ON public.community_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view published posts" ON public.community_posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

CREATE POLICY "Users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can edit own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete own posts" ON public.community_posts
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Anyone can view comments" ON public.community_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can edit own comments" ON public.community_comments
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can view votes" ON public.community_post_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON public.community_post_votes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own votes" ON public.community_post_votes
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Anyone can view follows" ON public.user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.user_follows
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = follower_id));

CREATE POLICY "Users can unfollow" ON public.user_follows
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = follower_id));

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can view own transactions" ON public.coin_transactions
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Step 19: Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General discussions about Erigga and his music', '💬', '#3B82F6', 1),
('Music & Lyrics', 'music', 'Discuss Erigga''s music, lyrics, and their meanings', '🎵', '#10B981', 2),
('Events & Shows', 'events', 'Information about upcoming events and shows', '🎤', '#EF4444', 3),
('Freestyle Corner', 'freestyle', 'Share your own freestyle lyrics and get feedback', '🔥', '#F59E0B', 4),
('Fan Art', 'art', 'Share your Erigga-inspired artwork', '🎨', '#8B5CF6', 5),
('News & Updates', 'news', 'Latest news and updates about Erigga', '📰', '#06B6D4', 6),
('Community Support', 'support', 'Help and support for community members', '🤝', '#84CC16', 7)
ON CONFLICT (name) DO NOTHING;

-- Step 20: Enable realtime (safely)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_votes;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Step 21: Final verification
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    category_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'community_categories', 'community_posts', 'community_comments', 'community_post_votes', 'community_comment_likes', 'user_follows', 'notifications', 'coin_transactions');
    
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('handle_post_vote', 'handle_new_user', 'update_user_stats');
    
    SELECT COUNT(*) INTO category_count
    FROM public.community_categories;
    
    RAISE NOTICE '=== CLEAN SCHEMA SETUP COMPLETED ===';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Functions created: %', function_count;
    RAISE NOTICE 'Categories available: %', category_count;
    RAISE NOTICE '=== READY FOR TESTING ===';
END $$;
