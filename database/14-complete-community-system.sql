-- =====================================================
-- COMPLETE COMMUNITY SYSTEM DATABASE SCHEMA
-- This is the FINAL comprehensive solution
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. USER PROFILES & SOCIAL FEATURES
-- =====================================================

-- User followers/following system
CREATE TABLE IF NOT EXISTS user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- User achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    badge_color VARCHAR(20) DEFAULT 'blue',
    points INTEGER DEFAULT 0,
    requirement_type VARCHAR(50) NOT NULL, -- 'posts_count', 'votes_received', 'comments_count', etc.
    requirement_value INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements earned
CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id BIGINT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- 2. ENHANCED COMMUNITY POSTS SYSTEM
-- =====================================================

-- Post reactions (beyond just votes)
CREATE TABLE IF NOT EXISTS post_reactions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL, -- 'fire', 'love', 'laugh', 'wow', 'sad', 'angry'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, reaction_type)
);

-- Post bookmarks/saves
CREATE TABLE IF NOT EXISTS post_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Hashtags system
CREATE TABLE IF NOT EXISTS hashtags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post hashtags relationship
CREATE TABLE IF NOT EXISTS post_hashtags (
    post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    hashtag_id BIGINT NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- User mentions in posts
CREATE TABLE IF NOT EXISTS post_mentions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    mentioned_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentioned_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER, -- Position in the text where mention occurs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ENHANCED COMMENTS SYSTEM
-- =====================================================

-- Comment reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction_type)
);

-- Comment mentions
CREATE TABLE IF NOT EXISTS comment_mentions (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    mentioned_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentioned_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. NOTIFICATIONS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'vote', 'comment', 'mention', 'follow', 'achievement', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 5. CHALLENGES & CONTESTS SYSTEM
-- =====================================================

-- Community challenges
CREATE TABLE IF NOT EXISTS challenges (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'special'
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reward_coins INTEGER DEFAULT 0,
    reward_badge VARCHAR(100),
    rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_data JSONB DEFAULT '{}',
    score INTEGER DEFAULT 0,
    rank INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- =====================================================
-- 6. LEADERBOARDS SYSTEM
-- =====================================================

-- User statistics for leaderboards
CREATE TABLE IF NOT EXISTS user_stats (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_posts INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    total_votes_given INTEGER DEFAULT 0,
    total_followers INTEGER DEFAULT 0,
    total_following INTEGER DEFAULT 0,
    total_achievements INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. PRIVATE MESSAGING SYSTEM
-- =====================================================

-- Message conversations
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    participant_1 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_2 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_1, participant_2),
    CHECK (participant_1 != participant_2)
);

-- Private messages
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Post reactions indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);

-- Hashtags indexes
CREATE INDEX IF NOT EXISTS idx_hashtags_trending ON hashtags(is_trending, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_name_trgm ON hashtags USING gin(name gin_trgm_ops);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1, participant_2);

-- User stats indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_reputation ON user_stats(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_posts ON user_stats(total_posts DESC);

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats based on the action
    IF TG_TABLE_NAME = 'community_posts' THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO user_stats (user_id, total_posts, updated_at)
            VALUES (NEW.user_id, 1, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                total_posts = user_stats.total_posts + 1,
                updated_at = NOW();
        END IF;
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO user_stats (user_id, total_comments, updated_at)
            VALUES (NEW.user_id, 1, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                total_comments = user_stats.total_comments + 1,
                updated_at = NOW();
        END IF;
    ELSIF TG_TABLE_NAME = 'community_post_votes' THEN
        IF TG_OP = 'INSERT' THEN
            -- Update voter stats
            INSERT INTO user_stats (user_id, total_votes_given, updated_at)
            VALUES (NEW.user_id, 1, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                total_votes_given = user_stats.total_votes_given + 1,
                updated_at = NOW();
                
            -- Update post creator stats
            UPDATE user_stats 
            SET total_votes_received = total_votes_received + 1,
                reputation_score = reputation_score + 10,
                updated_at = NOW()
            WHERE user_id = (SELECT user_id FROM community_posts WHERE id = NEW.post_id);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_stats_posts ON community_posts;
CREATE TRIGGER trigger_update_stats_posts
    AFTER INSERT ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

DROP TRIGGER IF EXISTS trigger_update_stats_comments ON community_comments;
CREATE TRIGGER trigger_update_stats_comments
    AFTER INSERT ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

DROP TRIGGER IF EXISTS trigger_update_stats_votes ON community_post_votes;
CREATE TRIGGER trigger_update_stats_votes
    AFTER INSERT ON community_post_votes
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Function to handle hashtag extraction and creation
CREATE OR REPLACE FUNCTION extract_and_create_hashtags(content TEXT, post_id BIGINT)
RETURNS VOID AS $$
DECLARE
    hashtag_match TEXT;
    hashtag_name TEXT;
    hashtag_slug TEXT;
    hashtag_id BIGINT;
BEGIN
    -- Extract hashtags using regex
    FOR hashtag_match IN 
        SELECT regexp_split_to_table(content, '\s+') 
        WHERE regexp_split_to_table(content, '\s+') ~ '^#[a-zA-Z0-9_]+$'
    LOOP
        hashtag_name := substring(hashtag_match from 2); -- Remove the #
        hashtag_slug := lower(hashtag_name);
        
        -- Insert or update hashtag
        INSERT INTO hashtags (name, slug, usage_count)
        VALUES (hashtag_name, hashtag_slug, 1)
        ON CONFLICT (slug) 
        DO UPDATE SET usage_count = hashtags.usage_count + 1
        RETURNING id INTO hashtag_id;
        
        -- Link hashtag to post
        INSERT INTO post_hashtags (post_id, hashtag_id)
        VALUES (post_id, hashtag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. SEED DATA FOR ACHIEVEMENTS
-- =====================================================

INSERT INTO achievements (name, description, icon, badge_color, points, requirement_type, requirement_value) VALUES
('First Post', 'Welcome to the community! You made your first post.', '🎉', 'green', 10, 'posts_count', 1),
('Getting Started', 'You''ve made 5 posts. Keep it up!', '🚀', 'blue', 25, 'posts_count', 5),
('Community Regular', 'You''ve made 25 posts. You''re becoming a regular!', '⭐', 'purple', 100, 'posts_count', 25),
('Community Star', 'Amazing! You''ve made 100 posts.', '🌟', 'gold', 500, 'posts_count', 100),
('Popular Creator', 'Your posts received 100 votes total!', '❤️', 'red', 200, 'votes_received', 100),
('Viral Creator', 'Wow! Your posts received 500 votes total!', '🔥', 'orange', 1000, 'votes_received', 500),
('Conversation Starter', 'You''ve made 50 comments. Great engagement!', '💬', 'cyan', 150, 'comments_count', 50),
('Community Helper', 'You''ve made 200 comments. Thanks for helping others!', '🤝', 'teal', 400, 'comments_count', 200),
('Supporter', 'You''ve given 50 votes to other posts. Great support!', '👍', 'indigo', 100, 'votes_given', 50),
('Super Supporter', 'You''ve given 200 votes to other posts. Amazing support!', '🙌', 'pink', 300, 'votes_given', 200)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 11. SEED DATA FOR CHALLENGES
-- =====================================================

INSERT INTO challenges (title, description, challenge_type, start_date, end_date, reward_coins, reward_badge, rules) VALUES
('Weekly Bars Challenge', 'Share your best bars this week! Most voted post wins.', 'weekly', 
 DATE_TRUNC('week', NOW()), DATE_TRUNC('week', NOW()) + INTERVAL '1 week', 
 500, 'Weekly Bars Champion', '{"category": "bars", "min_length": 50}'),
 
('Monthly Creator Challenge', 'Create the most engaging content this month!', 'monthly',
 DATE_TRUNC('month', NOW()), DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
 2000, 'Monthly Creator', '{"min_posts": 5, "min_engagement": 100}'),
 
('New Year Community Challenge', 'Welcome new members and help them get started!', 'special',
 NOW(), NOW() + INTERVAL '30 days',
 1000, 'Community Welcomer', '{"help_new_users": true, "min_comments": 20}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. UPDATE EXISTING TABLES (SAFE ADDITIONS)
-- =====================================================

-- Add missing columns to community_posts if they don't exist
DO $$ 
BEGIN
    -- Add view_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'view_count') THEN
        ALTER TABLE community_posts ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add reaction_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'reaction_count') THEN
        ALTER TABLE community_posts ADD COLUMN reaction_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add is_trending if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'is_trending') THEN
        ALTER TABLE community_posts ADD COLUMN is_trending BOOLEAN DEFAULT false;
    END IF;
    
    -- Add trending_score if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'trending_score') THEN
        ALTER TABLE community_posts ADD COLUMN trending_score DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add missing columns to users if they don't exist
DO $$ 
BEGIN
    -- Add reputation_score if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'reputation_score') THEN
        ALTER TABLE users ADD COLUMN reputation_score INTEGER DEFAULT 0;
    END IF;
    
    -- Add total_posts if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'total_posts') THEN
        ALTER TABLE users ADD COLUMN total_posts INTEGER DEFAULT 0;
    END IF;
    
    -- Add followers_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'followers_count') THEN
        ALTER TABLE users ADD COLUMN followers_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add following_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'following_count') THEN
        ALTER TABLE users ADD COLUMN following_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- 13. FINAL SETUP AND VERIFICATION
-- =====================================================

-- Create initial user stats for existing users
INSERT INTO user_stats (user_id, total_posts, total_comments, updated_at)
SELECT 
    u.id,
    COALESCE(p.post_count, 0),
    COALESCE(c.comment_count, 0),
    NOW()
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as post_count 
    FROM community_posts 
    WHERE is_deleted = false 
    GROUP BY user_id
) p ON u.id = p.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as comment_count 
    FROM community_comments 
    WHERE is_deleted = false 
    GROUP BY user_id
) c ON u.id = c.user_id
ON CONFLICT (user_id) DO NOTHING;

-- Update trending hashtags based on usage
UPDATE hashtags 
SET is_trending = true 
WHERE usage_count >= 10 
AND created_at >= NOW() - INTERVAL '7 days';

COMMIT;
