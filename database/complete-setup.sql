-- =====================================================
-- ERIGGA LIVE - COMPLETE DATABASE SETUP
-- =====================================================
-- This file contains the complete database setup for Erigga Live platform
-- Execute this entire file in your Supabase SQL editor

-- 1. ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 2. DROP EXISTING TABLES IF THEY EXIST (BE CAREFUL IN PRODUCTION)
DROP TABLE IF EXISTS public.comment_votes CASCADE;
DROP TABLE IF EXISTS public.post_votes CASCADE;
DROP TABLE IF EXISTS public.community_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.community_categories CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;
DROP TABLE IF EXISTS public.meet_greet_bookings CASCADE;
DROP TABLE IF EXISTS public.meet_greet_sessions CASCADE;
DROP TABLE IF EXISTS public.coin_transactions CASCADE;
DROP TABLE IF EXISTS public.merchandise CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.media_vault CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 3. CREATE USERS TABLE (LINKED TO AUTH.USERS)
CREATE TABLE public.users (
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

-- 4. CREATE COMMUNITY CATEGORIES
CREATE TABLE public.community_categories (
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

-- 5. CREATE COMMUNITY POSTS
CREATE TABLE public.community_posts (
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

-- 6. CREATE COMMUNITY COMMENTS
CREATE TABLE public.community_comments (
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

-- 7. CREATE VOTING SYSTEM
CREATE TABLE public.post_votes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE TABLE public.comment_votes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    comment_id INTEGER NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, comment_id)
);

-- 8. CREATE USER FOLLOWS SYSTEM
CREATE TABLE public.user_follows (
    id SERIAL PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- 9. CREATE NOTIFICATIONS SYSTEM
CREATE TABLE public.notifications (
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

-- 10. CREATE ACHIEVEMENTS SYSTEM
CREATE TABLE public.achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '🏆',
    badge_color VARCHAR(7) DEFAULT '#FFD700',
    points_reward INTEGER DEFAULT 0,
    coins_reward INTEGER DEFAULT 0,
    tier_requirement VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 11. CREATE COIN TRANSACTIONS
CREATE TABLE public.coin_transactions (
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

-- 12. CREATE MEET & GREET SYSTEM
CREATE TABLE public.meet_greet_sessions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
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

CREATE TABLE public.meet_greet_bookings (
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

-- 13. CREATE MEDIA VAULT
CREATE TABLE public.media_vault (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'audio', 'image', 'document')),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size BIGINT,
    duration INTEGER, -- for video/audio in seconds
    tier_required VARCHAR(50) DEFAULT 'grassroot' CHECK (tier_required IN ('grassroot', 'pioneer', 'elder', 'blood')),
    is_premium BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES public.users(auth_user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. CREATE MERCHANDISE SYSTEM
CREATE TABLE public.merchandise (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    coin_price INTEGER,
    category VARCHAR(100) NOT NULL,
    images TEXT[] DEFAULT '{}',
    sizes TEXT[] DEFAULT '{}',
    colors TEXT[] DEFAULT '{}',
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    total_coins INTEGER DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('paystack', 'coins', 'mixed')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status VARCHAR(50) DEFAULT 'processing' CHECK (order_status IN ('processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    payment_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_vote_count ON public.community_posts(vote_count DESC);
CREATE INDEX idx_community_posts_published ON public.community_posts(is_published, is_deleted);

CREATE INDEX idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX idx_community_comments_parent ON public.community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_created_at ON public.community_comments(created_at DESC);

CREATE INDEX idx_post_votes_post_id ON public.post_votes(post_id);
CREATE INDEX idx_post_votes_user_id ON public.post_votes(user_id);
CREATE INDEX idx_comment_votes_comment_id ON public.comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user_id ON public.comment_votes(user_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);

CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_created_at ON public.coin_transactions(created_at DESC);

CREATE INDEX idx_meet_greet_sessions_date ON public.meet_greet_sessions(date, time);
CREATE INDEX idx_meet_greet_sessions_status ON public.meet_greet_sessions(status);

CREATE INDEX idx_media_vault_type ON public.media_vault(type);
CREATE INDEX idx_media_vault_tier ON public.media_vault(tier_required);
CREATE INDEX idx_media_vault_created_at ON public.media_vault(created_at DESC);

-- 16. CREATE FUNCTIONS FOR VOTE COUNTING
CREATE OR REPLACE FUNCTION update_post_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts 
        SET 
            upvote_count = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'upvote'),
            downvote_count = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'downvote'),
            vote_count = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'downvote')
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts 
        SET 
            upvote_count = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = OLD.post_id AND vote_type = 'upvote'),
            downvote_count = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = OLD.post_id AND vote_type = 'downvote'),
            vote_count = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = OLD.post_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM public.post_votes WHERE post_id = OLD.post_id AND vote_type = 'downvote')
        WHERE id = OLD.post_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.community_posts 
        SET 
            upvote_count = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'upvote'),
            downvote_count = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'downvote'),
            vote_count = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 'downvote')
        WHERE id = NEW.post_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_comments 
        SET 
            upvote_count = (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'),
            downvote_count = (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'),
            vote_count = (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'downvote')
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_comments 
        SET 
            upvote_count = (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = OLD.comment_id AND vote_type = 'upvote'),
            downvote_count = (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = OLD.comment_id AND vote_type = 'downvote'),
            vote_count = (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = OLD.comment_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = OLD.comment_id AND vote_type = 'downvote')
        WHERE id = OLD.comment_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.community_comments 
        SET 
            upvote_count = (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'),
            downvote_count = (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'),
            vote_count = (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'upvote') - 
                        (SELECT COUNT(*) FROM public.comment_votes WHERE comment_id = NEW.comment_id AND vote_type = 'downvote')
        WHERE id = NEW.comment_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts 
        SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
        
        -- Update reply count for parent comment
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments
            SET reply_count = reply_count + 1
            WHERE id = NEW.parent_comment_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts 
        SET comment_count = comment_count - 1
        WHERE id = OLD.post_id;
        
        -- Update reply count for parent comment
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

CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_categories 
        SET post_count = post_count + 1
        WHERE id = NEW.category_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_categories 
        SET post_count = post_count - 1
        WHERE id = OLD.category_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id THEN
        UPDATE public.community_categories 
        SET post_count = post_count - 1
        WHERE id = OLD.category_id;
        
        UPDATE public.community_categories 
        SET post_count = post_count + 1
        WHERE id = NEW.category_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 17. CREATE FUNCTION TO HANDLE NEW USER REGISTRATION
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

-- 18. CREATE FUNCTION TO UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 19. CREATE TRIGGERS
CREATE TRIGGER trigger_update_post_vote_count
    AFTER INSERT OR DELETE OR UPDATE ON public.post_votes
    FOR EACH ROW EXECUTE FUNCTION update_post_vote_count();

CREATE TRIGGER trigger_update_comment_vote_count
    AFTER INSERT OR DELETE OR UPDATE ON public.comment_votes
    FOR EACH ROW EXECUTE FUNCTION update_comment_vote_count();

CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_count();

CREATE TRIGGER trigger_update_category_post_count
    AFTER INSERT OR DELETE OR UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION update_category_post_count();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp triggers
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_community_posts_updated_at
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_community_comments_updated_at
    BEFORE UPDATE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_meet_greet_sessions_updated_at
    BEFORE UPDATE ON public.meet_greet_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 20. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_greet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_greet_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 21. CREATE RLS POLICIES

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Categories policies
CREATE POLICY "Anyone can view categories" ON public.community_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.community_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- Posts policies
CREATE POLICY "Anyone can view published posts" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all posts" ON public.community_posts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.community_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all comments" ON public.community_comments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Votes policies
CREATE POLICY "Users can view all votes" ON public.post_votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON public.post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.post_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.post_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comment votes" ON public.comment_votes FOR SELECT USING (true);
CREATE POLICY "Users can create comment votes" ON public.comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comment votes" ON public.comment_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment votes" ON public.comment_votes FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can view all follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can create follows" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follows" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Achievements policies
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view all user achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "System can create user achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);

-- Coin transactions policies
CREATE POLICY "Users can view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create transactions" ON public.coin_transactions FOR INSERT WITH CHECK (true);

-- Meet & Greet policies
CREATE POLICY "Anyone can view sessions" ON public.meet_greet_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can manage sessions" ON public.meet_greet_sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view own bookings" ON public.meet_greet_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.meet_greet_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.meet_greet_bookings FOR UPDATE USING (auth.uid() = user_id);

-- Media vault policies
CREATE POLICY "Users can view accessible media" ON public.media_vault FOR SELECT USING (
    is_active = true AND (
        tier_required = 'grassroot' OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND (
                (tier_required = 'pioneer' AND tier IN ('pioneer', 'elder', 'blood')) OR
                (tier_required = 'elder' AND tier IN ('elder', 'blood')) OR
                (tier_required = 'blood' AND tier = 'blood')
            )
        )
    )
);

-- Merchandise policies
CREATE POLICY "Anyone can view active merchandise" ON public.merchandise FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage merchandise" ON public.merchandise FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);

-- 22. INSERT DEFAULT DATA

-- Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General discussions about Erigga and music', '💬', '#3B82F6', 1),
('Music & Lyrics', 'music', 'Discuss Erigga''s music, lyrics, and songs', '🎵', '#10B981', 2),
('Events & Concerts', 'events', 'Upcoming events, concerts, and performances', '🎤', '#F59E0B', 3),
('Fan Art & Creativity', 'fan-art', 'Share your creative works and fan art', '🎨', '#8B5CF6', 4),
('News & Updates', 'news', 'Latest news and updates about Erigga', '📰', '#EF4444', 5),
('Meet & Greet', 'meet-greet', 'Discussions about meet and greet sessions', '🤝', '#06B6D4', 6);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, badge_color, points_reward, coins_reward) VALUES
('Welcome to the Community', 'Join the Erigga Live community', '👋', '#10B981', 10, 50),
('First Post', 'Create your first community post', '📝', '#3B82F6', 25, 25),
('First Comment', 'Leave your first comment on a post', '💬', '#8B5CF6', 15, 15),
('Popular Post', 'Get 10 upvotes on a single post', '🔥', '#F59E0B', 50, 100),
('Community Helper', 'Get 50 total upvotes across all posts', '🤝', '#06B6D4', 100, 200),
('Veteran Member', 'Be a member for 30 days', '🏆', '#EF4444', 200, 500),
('Super Fan', 'Reach Elder tier status', '⭐', '#FFD700', 500, 1000);

-- 23. CREATE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
('post-media', 'post-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']),
('vault-media', 'vault-media', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav']);

-- 24. CREATE STORAGE POLICIES
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Post media is publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Authenticated users can upload post media" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'post-media' AND auth.role() = 'authenticated'
);

CREATE POLICY "Vault media is publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'vault-media');
CREATE POLICY "Admins can upload vault media" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'vault-media' AND 
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- 25. ENABLE REALTIME FOR TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;

-- 26. CREATE SAMPLE DATA (OPTIONAL - REMOVE IN PRODUCTION)
-- Uncomment the following lines if you want sample data for testing

/*
-- Sample users will be created automatically when they sign up through auth
-- Sample posts
INSERT INTO public.community_posts (user_id, category_id, title, content, hashtags) VALUES
((SELECT auth_user_id FROM public.users LIMIT 1), 1, 'Welcome to Erigga Live!', 'Excited to be part of this amazing community! 🎵', ARRAY['welcome', 'music', 'erigga']),
((SELECT auth_user_id FROM public.users LIMIT 1), 2, 'Favorite Erigga Song?', 'What''s your all-time favorite Erigga track? Mine has to be "The Erigma"!', ARRAY['music', 'favorites', 'discussion']);
*/

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your Erigga Live database is now fully configured with:
-- ✅ User management and authentication
-- ✅ Community posts and comments system
-- ✅ Voting and engagement features
-- ✅ Meet & Greet booking system
-- ✅ Coin economy and transactions
-- ✅ Media vault for exclusive content
-- ✅ Merchandise and orders system
-- ✅ Achievements and gamification
-- ✅ Real-time subscriptions
-- ✅ Row Level Security (RLS)
-- ✅ Storage buckets and policies
-- ✅ Performance indexes
-- ✅ Automated triggers and functions
-- 
-- Next steps:
-- 1. Test user registration through your app
-- 2. Create your first admin user and update their role
-- 3. Upload some initial content to the media vault
-- 4. Configure your environment variables
-- 5. Test all features thoroughly
-- =====================================================
