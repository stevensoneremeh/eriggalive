-- =====================================================
-- FIX SUPABASE STRUCTURE - FINAL SOLUTION
-- =====================================================

-- First, let's work with the existing auth.users table structure
-- and create a proper public.users table that references it

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can manage their own follows" ON user_follows;

-- Create the proper public.users table that works with Supabase auth
CREATE TABLE IF NOT EXISTS public.users (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    tier text DEFAULT 'grassroot',
    level integer DEFAULT 1,
    points integer DEFAULT 0,
    coins bigint DEFAULT 1000,
    bio text,
    location text,
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    reputation_score integer DEFAULT 0,
    total_posts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create function to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || NEW.id::text),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '/placeholder-user.jpg')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create user_follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    follower_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create community_categories table
CREATE TABLE IF NOT EXISTS public.community_categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    color text DEFAULT '#3B82F6',
    icon text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    post_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id bigint NOT NULL REFERENCES public.community_categories(id),
    content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 10000),
    media_url text,
    media_type text CHECK (media_type IN ('image', 'video', 'audio')),
    media_metadata jsonb DEFAULT '{}',
    vote_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    view_count integer DEFAULT 0,
    tags text[] DEFAULT '{}',
    mentions bigint[] DEFAULT '{}',
    hashtags text[] DEFAULT '{}',
    is_published boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    scheduled_at timestamp with time zone,
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create community_post_votes table
CREATE TABLE IF NOT EXISTS public.community_post_votes (
    post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS public.community_comments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id bigint REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    like_count integer DEFAULT 0,
    reply_count integer DEFAULT 0,
    mentions bigint[] DEFAULT '{}',
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create community_comment_likes table
CREATE TABLE IF NOT EXISTS public.community_comment_likes (
    comment_id bigint NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (comment_id, user_id)
);

-- Create post_reactions table
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'fire', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id, reaction_type)
);

-- Create user_bookmarks table
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    usage_count integer DEFAULT 0,
    trending_score real DEFAULT 0,
    is_trending boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create post_hashtags table
CREATE TABLE IF NOT EXISTS public.post_hashtags (
    post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    hashtag_id bigint NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('vote', 'comment', 'follow', 'mention', 'system', 'achievement')),
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    is_sent boolean DEFAULT false,
    sent_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Create achievement_definitions table
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    title text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    category text NOT NULL,
    points integer DEFAULT 0,
    badge_color text DEFAULT '#3B82F6',
    requirements jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id bigint NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
    progress jsonb DEFAULT '{}',
    completed_at timestamp with time zone,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    description text NOT NULL,
    type text NOT NULL CHECK (type IN ('weekly', 'monthly', 'special')),
    requirements jsonb NOT NULL,
    rewards jsonb DEFAULT '{}',
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    participant_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Create challenge_participants table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    challenge_id bigint NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    progress jsonb DEFAULT '{}',
    score integer DEFAULT 0,
    completed_at timestamp with time zone,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(challenge_id, user_id)
);

-- Insert default categories
INSERT INTO public.community_categories (name, slug, description, color, icon, display_order) VALUES
('General', 'general', 'General discussions and conversations', '#3B82F6', '💬', 1),
('Bars', 'bars', 'Share your best bars and lyrics', '#EF4444', '🎤', 2),
('Stories', 'stories', 'Share your personal stories and experiences', '#10B981', '📖', 3),
('Events', 'events', 'Upcoming events and announcements', '#8B5CF6', '🎉', 4),
('Music', 'music', 'Music discussions and recommendations', '#F59E0B', '🎵', 5),
('News', 'news', 'Latest news and updates', '#6B7280', '📰', 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert achievement definitions
INSERT INTO public.achievement_definitions (name, title, description, icon, category, points, badge_color, requirements) VALUES
('first_post', 'First Post', 'Created your first community post', '🎉', 'engagement', 50, '#10B981', '{"posts_created": 1}'),
('social_butterfly', 'Social Butterfly', 'Followed 10 other users', '🦋', 'social', 100, '#3B82F6', '{"users_followed": 10}'),
('popular_creator', 'Popular Creator', 'Received 100 votes on your posts', '⭐', 'engagement', 500, '#F59E0B', '{"votes_received": 100}'),
('conversation_starter', 'Conversation Starter', 'Created 10 posts', '💭', 'engagement', 200, '#8B5CF6', '{"posts_created": 10}'),
('helpful_member', 'Helpful Member', 'Left 50 comments', '🤝', 'engagement', 150, '#06B6D4', '{"comments_created": 50}'),
('coin_collector', 'Coin Collector', 'Earned 1000 Erigga Coins', '🪙', 'economy', 300, '#F59E0B', '{"coins_earned": 1000}'),
('trendsetter', 'Trendsetter', 'Created a trending post', '🔥', 'engagement', 1000, '#EF4444', '{"trending_posts": 1}'),
('community_veteran', 'Community Veteran', 'Active member for 30 days', '🏆', 'loyalty', 750, '#7C3AED', '{"days_active": 30}')
ON CONFLICT (name) DO NOTHING;

-- Create sample users (these will be created when auth users sign up)
-- But let's create some test data for existing auth users if any exist
DO $$
DECLARE
    auth_user_record RECORD;
BEGIN
    -- Loop through existing auth users and create public.users records
    FOR auth_user_record IN 
        SELECT id, email, raw_user_meta_data 
        FROM auth.users 
        WHERE id NOT IN (SELECT auth_user_id FROM public.users)
    LOOP
        INSERT INTO public.users (auth_user_id, username, full_name, avatar_url)
        VALUES (
            auth_user_record.id,
            COALESCE(auth_user_record.raw_user_meta_data->>'username', 'user_' || auth_user_record.id::text),
            COALESCE(auth_user_record.raw_user_meta_data->>'full_name', 'User'),
            COALESCE(auth_user_record.raw_user_meta_data->>'avatar_url', '/placeholder-user.jpg')
        );
    END LOOP;
END $$;

-- Create some sample posts if we have users
DO $$
DECLARE
    sample_user_id bigint;
    general_cat_id bigint;
    bars_cat_id bigint;
    stories_cat_id bigint;
    events_cat_id bigint;
BEGIN
    -- Get a sample user
    SELECT id INTO sample_user_id FROM public.users LIMIT 1;
    
    -- Get category IDs
    SELECT id INTO general_cat_id FROM public.community_categories WHERE slug = 'general';
    SELECT id INTO bars_cat_id FROM public.community_categories WHERE slug = 'bars';
    SELECT id INTO stories_cat_id FROM public.community_categories WHERE slug = 'stories';
    SELECT id INTO events_cat_id FROM public.community_categories WHERE slug = 'events';
    
    -- Only create posts if we have a user
    IF sample_user_id IS NOT NULL THEN
        INSERT INTO public.community_posts (user_id, category_id, content, vote_count, comment_count, hashtags, created_at) VALUES
        (sample_user_id, general_cat_id, 'Welcome to the official Erigga community! 🎵 This is where we connect, share, and celebrate the culture. Drop your favorite Erigga lyrics below! #PaperBoi #EriggaFamily', 45, 12, ARRAY['PaperBoi', 'EriggaFamily'], NOW() - INTERVAL '1 hour'),
        (sample_user_id, bars_cat_id, E'Just dropped some fire bars! 🔥🔥🔥\n\n"Money dey my pocket, I no dey fear anybody\nNa God dey my back, I no need security\nFrom Warri to Lagos, dem know say I dey carry\nThe streets dey feel me, my story legendary"\n\nWhat y''all think? Rate this bar 1-10! 💯 #Bars #EriggaLyrics', 38, 8, ARRAY['Bars', 'EriggaLyrics'], NOW() - INTERVAL '2 hours'),
        (sample_user_id, stories_cat_id, E'Real talk: Remember when Erigga first started and nobody believed in the sound? Now look at where we are! 🙌\n\nThat''s why I never give up on my dreams. If Paper Boi can make it from the streets to the top, we all can make it too. What''s your biggest dream right now? Let''s motivate each other! 💪 #Motivation #Dreams', 29, 15, ARRAY['Motivation', 'Dreams'], NOW() - INTERVAL '3 hours'),
        (sample_user_id, events_cat_id, E'YO! Who else is going to the Lagos concert next month?! 🎤🎵\n\nI''ve been waiting for this for months! The energy is going to be INSANE! If you''re going, drop a comment so we can link up. Let''s make this the biggest Erigga concert ever!\n\n#EriggaLive #LagosShow #PaperBoiTour', 52, 23, ARRAY['EriggaLive', 'LagosShow', 'PaperBoiTour'], NOW() - INTERVAL '4 hours');
        
        -- Update user post count
        UPDATE public.users SET posts_count = 4, total_posts = 4 WHERE id = sample_user_id;
        
        -- Update category post counts
        UPDATE public.community_categories SET post_count = 2 WHERE slug = 'general';
        UPDATE public.community_categories SET post_count = 1 WHERE slug = 'bars';
        UPDATE public.community_categories SET post_count = 1 WHERE slug = 'stories';
        UPDATE public.community_categories SET post_count = 1 WHERE slug = 'events';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count ON public.community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_hashtags ON public.community_posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Enhanced vote handling function
CREATE OR REPLACE FUNCTION handle_post_vote(
    p_post_id bigint,
    p_voter_auth_id text,
    p_coin_amount integer DEFAULT 100
)
RETURNS boolean AS $$
DECLARE
    v_voter_id bigint;
    v_creator_id bigint;
    v_existing_vote boolean := false;
    v_voter_coins bigint;
BEGIN
    -- Get voter's internal ID and coin balance
    SELECT id, coins INTO v_voter_id, v_voter_coins
    FROM public.users 
    WHERE auth_user_id = p_voter_auth_id::uuid;
    
    IF v_voter_id IS NULL THEN
        RAISE EXCEPTION 'Voter not found';
    END IF;
    
    -- Get post creator's ID
    SELECT user_id INTO v_creator_id
    FROM public.community_posts 
    WHERE id = p_post_id;
    
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Post not found';
    END IF;
    
    -- Check if voting on own post
    IF v_voter_id = v_creator_id THEN
        RAISE EXCEPTION 'Cannot vote on own post';
    END IF;
    
    -- Check if vote already exists
    SELECT EXISTS(
        SELECT 1 FROM public.community_post_votes 
        WHERE post_id = p_post_id AND user_id = v_voter_id
    ) INTO v_existing_vote;
    
    IF v_existing_vote THEN
        -- Remove vote and refund coins
        DELETE FROM public.community_post_votes 
        WHERE post_id = p_post_id AND user_id = v_voter_id;
        
        -- Update vote count
        UPDATE public.community_posts 
        SET vote_count = vote_count - 1 
        WHERE id = p_post_id;
        
        -- Refund coins to voter
        UPDATE public.users 
        SET coins = coins + p_coin_amount 
        WHERE id = v_voter_id;
        
        -- Remove coins from creator
        UPDATE public.users 
        SET coins = coins - p_coin_amount 
        WHERE id = v_creator_id;
        
        RETURN false;
    ELSE
        -- Check if voter has enough coins
        IF v_voter_coins < p_coin_amount THEN
            RAISE EXCEPTION 'Insufficient coins';
        END IF;
        
        -- Add vote
        INSERT INTO public.community_post_votes (post_id, user_id)
        VALUES (p_post_id, v_voter_id);
        
        -- Update vote count
        UPDATE public.community_posts 
        SET vote_count = vote_count + 1 
        WHERE id = p_post_id;
        
        -- Transfer coins
        UPDATE public.users 
        SET coins = coins - p_coin_amount 
        WHERE id = v_voter_id;
        
        UPDATE public.users 
        SET coins = coins + p_coin_amount 
        WHERE id = v_creator_id;
        
        -- Create notification for post creator
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            v_creator_id, 
            'vote', 
            'New Vote on Your Post!', 
            'Someone voted on your post and sent you ' || p_coin_amount || ' Erigga Coins!',
            jsonb_build_object('post_id', p_post_id, 'voter_id', v_voter_id, 'coins', p_coin_amount)
        );
        
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Categories are viewable by everyone" ON public.community_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Published posts are viewable by everyone" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can insert their own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Comments are viewable by everyone" ON public.community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can insert their own comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own comments" ON public.community_comments FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can manage their own bookmarks" ON public.user_bookmarks FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

SELECT 'Community system setup completed successfully!' as result;
