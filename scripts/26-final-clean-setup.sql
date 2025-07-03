-- =====================================================
-- FINAL CLEAN SETUP - Single script to rule them all
-- =====================================================
-- This script completely resets and creates a working community system

-- Step 1: Clean slate - drop everything
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;

-- Step 2: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Step 3: Create users table with UUID primary key
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL,
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

-- Step 4: Create community categories
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

-- Step 5: Create community posts
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

-- Step 6: Create community comments
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

-- Step 7: Create voting system
CREATE TABLE public.community_post_votes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Step 8: Create comment likes
CREATE TABLE public.community_comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Step 9: Create user follows
CREATE TABLE public.user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Step 10: Create notifications
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

-- Step 11: Create coin transactions
CREATE TABLE public.coin_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'reward', 'vote', 'refund')),
    description TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 12: Create performance indexes
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

-- Step 13: Create automatic user creation function
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
        RAISE WARNING 'Failed to create user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 14: Create vote handling function
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

-- Step 16: Create triggers
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

-- Step 18: Create RLS policies
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
('Community Support', 'support', 'Help and support for community members', '🤝', '#84CC16', 7);

-- Step 20: Create test users with proper UUIDs
DO $$
DECLARE
    test_user_1_id UUID := gen_random_uuid();
    test_user_2_id UUID := gen_random_uuid();
    test_user_3_id UUID := gen_random_uuid();
    test_post_1_id BIGINT;
    test_post_2_id BIGINT;
    test_post_3_id BIGINT;
    test_post_4_id BIGINT;
BEGIN
    -- Insert test users
    INSERT INTO public.users (
        id,
        auth_user_id,
        username,
        full_name,
        email,
        avatar_url,
        bio,
        tier,
        coins,
        reputation_score
    ) VALUES 
    (
        test_user_1_id,
        test_user_1_id,
        'eriggaofficial',
        'Erigga Official',
        'erigga@official.com',
        '/placeholder-user.jpg',
        'The Paper Boi himself. Welcome to my community! 🎵',
        'blood',
        10000,
        5000
    ),
    (
        test_user_2_id,
        test_user_2_id,
        'warriking',
        'Warri King',
        'warri@king.com',
        '/placeholder-user.jpg',
        'Representing Warri to the fullest. Erigga fan since day one! 🔥',
        'pioneer',
        5000,
        2500
    ),
    (
        test_user_3_id,
        test_user_3_id,
        'naijafan',
        'Naija Music Fan',
        'naija@fan.com',
        '/placeholder-user.jpg',
        'Love good music, especially Erigga''s bars! 🎧',
        'grassroot',
        2000,
        1000
    );
    
    -- Create sample posts
    INSERT INTO public.community_posts (
        user_id,
        category_id,
        content,
        hashtags,
        vote_count,
        view_count
    ) VALUES 
    (
        test_user_1_id,
        1,
        'Welcome to the official Erigga community! 🎵 

This is where real music lovers gather. Share your thoughts, bars, and connect with fellow fans. Let''s build something special together! 

Drop your favorite Erigga track in the comments below! 👇

#EriggaMovement #PaperBoi #Community',
        ARRAY['EriggaMovement', 'PaperBoi', 'Community', 'Welcome'],
        25,
        150
    ),
    (
        test_user_2_id,
        4,
        'Just dropped some fire bars inspired by the Paper Boi himself! 🔥

*From the streets of Warri to the top of the game*
*Erigga showed us how to hustle through the pain*
*Paper Boi flow, now we all want the same*
*Success and respect, that''s the ultimate aim*

What y''all think? Drop your bars below! 🎤

#Freestyle #EriggaBars #Warri #PaperBoiVibes',
        ARRAY['Freestyle', 'EriggaBars', 'Warri', 'PaperBoiVibes'],
        18,
        89
    ),
    (
        test_user_3_id,
        2,
        'Can we talk about how deep "The Erigma" album is? 🎧 

Every track tells a story, every bar hits different. My favorite has to be "Motivation" - that song changed my perspective on life.

What''s your favorite Erigga track and why? Let''s discuss! 💭

#TheErigma #Motivation #DeepLyrics #RealMusic',
        ARRAY['TheErigma', 'Motivation', 'DeepLyrics', 'RealMusic'],
        12,
        67
    ),
    (
        test_user_1_id,
        3,
        'Big announcement coming soon! 📢 

Can''t say much yet, but something special is in the works for all my fans. Been working on this for months and I know y''all going to love it.

Stay tuned and keep supporting real music! 🙏

#ComingSoon #BigNews #Announcement',
        ARRAY['ComingSoon', 'BigNews', 'Announcement'],
        45,
        234
    )
    RETURNING id INTO test_post_1_id;
    
    -- Get post IDs for comments and votes
    SELECT id INTO test_post_1_id FROM public.community_posts WHERE user_id = test_user_1_id AND content LIKE 'Welcome to the official%' LIMIT 1;
    SELECT id INTO test_post_2_id FROM public.community_posts WHERE user_id = test_user_2_id AND content LIKE 'Just dropped some fire%' LIMIT 1;
    SELECT id INTO test_post_3_id FROM public.community_posts WHERE user_id = test_user_3_id AND content LIKE 'Can we talk about%' LIMIT 1;
    SELECT id INTO test_post_4_id FROM public.community_posts WHERE user_id = test_user_1_id AND content LIKE 'Big announcement%' LIMIT 1;
    
    -- Create sample comments
    INSERT INTO public.community_comments (post_id, user_id, content) VALUES 
    (test_post_1_id, test_user_2_id, 'First! 🔥 So excited for this community!'),
    (test_post_1_id, test_user_3_id, 'This is amazing! My favorite track is "Motivation"!'),
    (test_post_2_id, test_user_1_id, 'Those bars are fire! 🔥 Keep pushing the culture!'),
    (test_post_2_id, test_user_3_id, 'Yo this is sick! The flow reminds me of "Paper Boi"!'),
    (test_post_3_id, test_user_1_id, 'Appreciate the love for "The Erigma"!'),
    (test_post_3_id, test_user_2_id, 'Facts! "Motivation" is a masterpiece!'),
    (test_post_4_id, test_user_2_id, 'Can''t wait! We''re ready! 🙌'),
    (test_post_4_id, test_user_3_id, 'The suspense is killing me! 😅');
    
    -- Create sample votes
    INSERT INTO public.community_post_votes (post_id, user_id) VALUES 
    (test_post_1_id, test_user_2_id),
    (test_post_1_id, test_user_3_id),
    (test_post_2_id, test_user_1_id),
    (test_post_2_id, test_user_3_id),
    (test_post_3_id, test_user_1_id),
    (test_post_3_id, test_user_2_id),
    (test_post_4_id, test_user_2_id),
    (test_post_4_id, test_user_3_id);
    
    -- Create sample follows
    INSERT INTO public.user_follows (follower_id, following_id) VALUES 
    (test_user_2_id, test_user_1_id),
    (test_user_3_id, test_user_1_id),
    (test_user_3_id, test_user_2_id);
    
    -- Update counts to match actual data
    UPDATE public.community_posts 
    SET vote_count = (SELECT COUNT(*) FROM public.community_post_votes WHERE post_id = public.community_posts.id),
        comment_count = (SELECT COUNT(*) FROM public.community_comments WHERE post_id = public.community_posts.id);
    
    UPDATE public.users 
    SET posts_count = (SELECT COUNT(*) FROM public.community_posts WHERE user_id = public.users.id),
        followers_count = (SELECT COUNT(*) FROM public.user_follows WHERE following_id = public.users.id),
        following_count = (SELECT COUNT(*) FROM public.user_follows WHERE follower_id = public.users.id);
    
    UPDATE public.community_categories 
    SET post_count = (SELECT COUNT(*) FROM public.community_posts WHERE category_id = public.community_categories.id);
    
END $$;

-- Step 21: Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_votes;

-- Step 22: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '=== ERIGGA COMMUNITY SETUP COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM public.users);
    RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM public.community_categories);
    RAISE NOTICE 'Posts: %', (SELECT COUNT(*) FROM public.community_posts);
    RAISE NOTICE 'Comments: %', (SELECT COUNT(*) FROM public.community_comments);
    RAISE NOTICE 'Votes: %', (SELECT COUNT(*) FROM public.community_post_votes);
    RAISE NOTICE 'Follows: %', (SELECT COUNT(*) FROM public.user_follows);
    RAISE NOTICE '=== READY TO USE! ===';
END $$;
