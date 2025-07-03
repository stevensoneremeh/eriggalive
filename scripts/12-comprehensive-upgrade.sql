-- =====================================================
-- COMPREHENSIVE PLATFORM UPGRADE
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- 1. USER SYSTEM ENHANCEMENTS
-- =====================================================

-- Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS coins bigint DEFAULT 1000,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS wallet_address text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason text,
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone,
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by bigint REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret text,
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS posts_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievements jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"email": true, "push": true, "in_app": true}',
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"profile_public": true, "show_activity": true}';

-- Create user follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    follower_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create user blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    blocker_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- =====================================================
-- 2. ENHANCED COMMUNITY SYSTEM
-- =====================================================

-- Create community categories if not exists
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

-- Enhanced community posts
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

-- Community post votes
CREATE TABLE IF NOT EXISTS public.community_post_votes (
    post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

-- Enhanced comments system
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

-- Comment likes
CREATE TABLE IF NOT EXISTS public.community_comment_likes (
    comment_id bigint NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (comment_id, user_id)
);

-- =====================================================
-- 3. NOTIFICATIONS SYSTEM
-- =====================================================

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

-- =====================================================
-- 4. PRIVATE MESSAGING SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    type text DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    title text,
    description text,
    avatar_url text,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    conversation_id bigint NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at timestamp with time zone DEFAULT now(),
    left_at timestamp with time zone,
    last_read_at timestamp with time zone DEFAULT now(),
    is_muted boolean DEFAULT false,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    conversation_id bigint NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 5000),
    message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'system')),
    media_url text,
    media_metadata jsonb DEFAULT '{}',
    reply_to_id bigint REFERENCES public.messages(id),
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 5. ACHIEVEMENTS & GAMIFICATION
-- =====================================================

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

-- =====================================================
-- 6. CONTENT MODERATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.community_reports (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    reporter_user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_id bigint NOT NULL,
    target_type text NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'message')),
    reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'copyright', 'other')),
    additional_notes text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by bigint REFERENCES public.users(id),
    reviewed_at timestamp with time zone,
    resolution text,
    is_resolved boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 7. ANALYTICS & TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    target_type text,
    target_id bigint,
    metadata jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_views (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id bigint REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address inet,
    user_agent text,
    view_duration integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 8. BOOKMARKS & SAVED CONTENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_type text NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
    target_id bigint NOT NULL,
    collection_name text DEFAULT 'default',
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, target_type, target_id)
);

-- =====================================================
-- 9. DRAFT SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.post_drafts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    category_id bigint REFERENCES public.community_categories(id),
    media_url text,
    media_type text,
    media_metadata jsonb DEFAULT '{}',
    tags text[] DEFAULT '{}',
    mentions bigint[] DEFAULT '{}',
    hashtags text[] DEFAULT '{}',
    scheduled_at timestamp with time zone,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 10. HASHTAGS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.hashtags (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    usage_count integer DEFAULT 0,
    trending_score real DEFAULT 0,
    is_trending boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
    post_id bigint NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    hashtag_id bigint NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count ON public.community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_published ON public.community_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_deleted ON public.community_posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_community_posts_hashtags ON public.community_posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_community_posts_content_search ON public.community_posts USING GIN(to_tsvector('english', content));

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id ON public.community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON public.community_comments(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.user_activity_logs(created_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update user post count
        UPDATE public.users 
        SET posts_count = posts_count + 1 
        WHERE id = NEW.user_id;
        
        -- Update category post count
        UPDATE public.community_categories 
        SET post_count = post_count + 1 
        WHERE id = NEW.category_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update user post count
        UPDATE public.users 
        SET posts_count = posts_count - 1 
        WHERE id = OLD.user_id;
        
        -- Update category post count
        UPDATE public.community_categories 
        SET post_count = post_count - 1 
        WHERE id = OLD.category_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post counts
DROP TRIGGER IF EXISTS trigger_update_post_counts ON public.community_posts;
CREATE TRIGGER trigger_update_post_counts
    AFTER INSERT OR DELETE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update post comment count
        UPDATE public.community_posts 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.post_id;
        
        -- Update parent comment reply count
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments 
            SET reply_count = reply_count + 1 
            WHERE id = NEW.parent_comment_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update post comment count
        UPDATE public.community_posts 
        SET comment_count = comment_count - 1 
        WHERE id = OLD.post_id;
        
        -- Update parent comment reply count
        IF OLD.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments 
            SET reply_count = reply_count - 1 
            WHERE id = OLD.parent_comment_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment counts
DROP TRIGGER IF EXISTS trigger_update_comment_counts ON public.community_comments;
CREATE TRIGGER trigger_update_comment_counts
    AFTER INSERT OR DELETE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update follower count
        UPDATE public.users 
        SET followers_count = followers_count + 1 
        WHERE id = NEW.following_id;
        
        -- Update following count
        UPDATE public.users 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update follower count
        UPDATE public.users 
        SET followers_count = followers_count - 1 
        WHERE id = OLD.following_id;
        
        -- Update following count
        UPDATE public.users 
        SET following_count = following_count - 1 
        WHERE id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follower counts
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON public.user_follows;
CREATE TRIGGER trigger_update_follower_counts
    AFTER INSERT OR DELETE ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- Enhanced vote handling function
CREATE OR REPLACE FUNCTION handle_post_vote(
    p_post_id bigint,
    p_voter_auth_id text,
    p_post_creator_auth_id text,
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
    
    -- Get creator's internal ID
    SELECT id INTO v_creator_id
    FROM public.users 
    WHERE auth_user_id = p_post_creator_auth_id::uuid;
    
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Post creator not found';
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
        
        -- Log transaction
        INSERT INTO public.user_activity_logs (user_id, action, target_type, target_id, metadata)
        VALUES (v_voter_id, 'vote_removed', 'post', p_post_id, jsonb_build_object('coins_refunded', p_coin_amount));
        
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
        
        -- Log transaction
        INSERT INTO public.user_activity_logs (user_id, action, target_type, target_id, metadata)
        VALUES (v_voter_id, 'vote_added', 'post', p_post_id, jsonb_build_object('coins_spent', p_coin_amount));
        
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

-- =====================================================
-- SEED DATA
-- =====================================================

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

-- Enable Row Level Security
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can read public content, modify their own)
CREATE POLICY "Public categories are viewable by everyone" ON public.community_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Published posts are viewable by everyone" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can insert their own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own posts" ON public.community_posts FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));

CREATE POLICY "Comments are viewable by everyone" ON public.community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can insert their own comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own comments" ON public.community_comments FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));

CREATE POLICY "Users can manage their own bookmarks" ON public.user_bookmarks FOR ALL USING (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));
CREATE POLICY "Users can manage their own drafts" ON public.post_drafts FOR ALL USING (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
