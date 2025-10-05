-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE transaction_type AS ENUM ('earn', 'spend', 'bonus', 'refund', 'withdrawal');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE content_type AS ENUM ('track', 'album', 'video', 'image', 'document');
CREATE TYPE notification_type AS ENUM ('system', 'community', 'payment', 'content');

-- Users table (core authentication and profile)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    tier user_tier DEFAULT 'free',
    role user_role DEFAULT 'user',
    coins_balance INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extended profile information)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    display_name TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    location TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    total_posts INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community posts
CREATE TABLE public.community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    image_url TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    coin_votes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post comments
CREATE TABLE public.post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post votes
CREATE TABLE public.post_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote', 'coin_vote')),
    coins_spent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id, vote_type)
);

-- Comment votes
CREATE TABLE public.comment_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Coin transactions
CREATE TABLE public.coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'completed',
    description TEXT,
    reference_id UUID,
    reference_type TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shoutouts
CREATE TABLE public.shoutouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    coins_spent INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    ticket_price INTEGER DEFAULT 0,
    max_tickets INTEGER,
    tickets_sold INTEGER DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event tickets
CREATE TABLE public.event_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ticket_code TEXT UNIQUE NOT NULL,
    purchase_price INTEGER NOT NULL,
    payment_reference TEXT,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store products (merchandise)
CREATE TABLE public.store_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image_url TEXT,
    category TEXT DEFAULT 'merchandise',
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store purchases
CREATE TABLE public.store_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.store_products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    payment_reference TEXT,
    shipping_address JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media content (vault)
CREATE TABLE public.media_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds for audio/video
    file_size INTEGER, -- in bytes
    required_tier user_tier DEFAULT 'free',
    is_premium BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User follows
CREATE TABLE public.user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions system
CREATE TABLE public.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_coins INTEGER DEFAULT 0,
    required_tier user_tier DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User mission progress
CREATE TABLE public.user_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- Referrals system
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reward_coins INTEGER DEFAULT 100,
    is_rewarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- Vault views tracking
CREATE TABLE public.vault_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES public.media_content(id) ON DELETE CASCADE,
    view_duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoutouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own profile and public profiles
CREATE POLICY "Users can view public profiles" ON public.users
    FOR SELECT USING (is_active = true AND is_banned = false);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Community posts policies
CREATE POLICY "Anyone can view posts" ON public.community_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.post_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own comments" ON public.post_comments
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Voting policies
CREATE POLICY "Anyone can view votes" ON public.post_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own votes" ON public.post_votes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Anyone can view comment votes" ON public.comment_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own comment votes" ON public.comment_votes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Coin transactions policies
CREATE POLICY "Users can view their own transactions" ON public.coin_transactions
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create their own transactions" ON public.coin_transactions
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Shoutouts policies
CREATE POLICY "Anyone can view approved shoutouts" ON public.shoutouts
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create shoutouts" ON public.shoutouts
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Events and tickets policies
CREATE POLICY "Anyone can view active events" ON public.events
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own tickets" ON public.event_tickets
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create tickets" ON public.event_tickets
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Store policies
CREATE POLICY "Anyone can view active products" ON public.store_products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own purchases" ON public.store_purchases
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create purchases" ON public.store_purchases
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Media content policies (tier-based access)
CREATE POLICY "Users can view content based on tier" ON public.media_content
    FOR SELECT USING (
        NOT is_premium OR 
        required_tier <= (SELECT tier FROM public.users WHERE auth_user_id = auth.uid())::text::user_tier
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Admin policies for content management
CREATE POLICY "Admins can manage all content" ON public.community_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage events" ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage products" ON public.store_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create indexes for performance
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_category ON public.community_posts(category);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_votes_post_id ON public.post_votes(post_id);
CREATE INDEX idx_post_votes_user_id ON public.post_votes(user_id);
CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_created_at ON public.coin_transactions(created_at DESC);
CREATE INDEX idx_event_tickets_user_id ON public.event_tickets(user_id);
CREATE INDEX idx_store_purchases_user_id ON public.store_purchases(user_id);
CREATE INDEX idx_media_content_tier ON public.media_content(required_tier);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_products_updated_at BEFORE UPDATE ON public.store_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_content_updated_at BEFORE UPDATE ON public.media_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile when user is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, display_name, subscription_tier)
    VALUES (NEW.id, NEW.full_name, NEW.tier::text);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to update post vote counts
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE public.community_posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSIF NEW.vote_type = 'downvote' THEN
            UPDATE public.community_posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        ELSIF NEW.vote_type = 'coin_vote' THEN
            UPDATE public.community_posts SET coin_votes = coin_votes + NEW.coins_spent WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE public.community_posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
        ELSIF OLD.vote_type = 'downvote' THEN
            UPDATE public.community_posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
        ELSIF OLD.vote_type = 'coin_vote' THEN
            UPDATE public.community_posts SET coin_votes = coin_votes - OLD.coins_spent WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_post_vote_counts
    AFTER INSERT OR DELETE ON public.post_votes
    FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_post_comment_count
    AFTER INSERT OR DELETE ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- RPC Functions for API
CREATE OR REPLACE FUNCTION get_community_posts_with_user_data(
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    image_url TEXT,
    upvotes INTEGER,
    downvotes INTEGER,
    coin_votes INTEGER,
    comment_count INTEGER,
    is_pinned BOOLEAN,
    is_featured BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    tier TEXT,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.content,
        p.category,
        p.image_url,
        p.upvotes,
        p.downvotes,
        p.coin_votes,
        p.comment_count,
        p.is_pinned,
        p.is_featured,
        p.created_at,
        p.updated_at,
        u.id as user_id,
        u.username,
        u.full_name,
        u.avatar_url,
        u.tier::text,
        u.is_verified
    FROM public.community_posts p
    JOIN public.users u ON p.user_id = u.id
    WHERE u.is_active = true AND u.is_banned = false
    ORDER BY p.is_pinned DESC, p.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_community_post(
    post_title TEXT,
    post_content TEXT,
    post_category TEXT DEFAULT 'general',
    post_image_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    current_user_id UUID;
    new_post_id UUID;
BEGIN
    -- Get current user ID
    SELECT id INTO current_user_id 
    FROM public.users 
    WHERE auth_user_id = auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Create the post
    INSERT INTO public.community_posts (user_id, title, content, category, image_url)
    VALUES (current_user_id, post_title, post_content, post_category, post_image_url)
    RETURNING id INTO new_post_id;
    
    RETURN new_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION vote_on_post(
    post_id UUID,
    vote_type TEXT,
    coins_to_spend INTEGER DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    existing_vote_id UUID;
BEGIN
    -- Get current user ID
    SELECT id INTO current_user_id 
    FROM public.users 
    WHERE auth_user_id = auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Check for existing vote
    SELECT id INTO existing_vote_id
    FROM public.post_votes
    WHERE post_votes.post_id = vote_on_post.post_id 
    AND user_id = current_user_id 
    AND post_votes.vote_type = vote_on_post.vote_type;
    
    IF existing_vote_id IS NOT NULL THEN
        -- Remove existing vote
        DELETE FROM public.post_votes WHERE id = existing_vote_id;
        RETURN false;
    ELSE
        -- Add new vote
        INSERT INTO public.post_votes (post_id, user_id, vote_type, coins_spent)
        VALUES (vote_on_post.post_id, current_user_id, vote_on_post.vote_type, coins_to_spend);
        
        -- Deduct coins if coin vote
        IF vote_on_post.vote_type = 'coin_vote' AND coins_to_spend > 0 THEN
            UPDATE public.users 
            SET coins_balance = coins_balance - coins_to_spend
            WHERE id = current_user_id;
        END IF;
        
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data
INSERT INTO public.missions (title, description, reward_coins, required_tier) VALUES
('Welcome to EriggaLive', 'Complete your profile setup', 100, 'free'),
('First Post', 'Create your first community post', 50, 'free'),
('Community Engagement', 'Comment on 5 different posts', 75, 'free'),
('Vote Power', 'Cast 10 votes on community posts', 25, 'free'),
('Premium Explorer', 'Access premium content', 200, 'pro');

INSERT INTO public.events (title, description, event_date, location, ticket_price, max_tickets) VALUES
('Erigga Live Concert 2024', 'The biggest Erigga concert of the year', '2024-12-31 20:00:00+00', 'Lagos, Nigeria', 15000, 5000),
('Meet & Greet Session', 'Exclusive meet and greet with Erigga', '2024-11-15 18:00:00+00', 'Warri, Delta State', 25000, 100);

INSERT INTO public.store_products (name, description, price, category, stock_quantity) VALUES
('Erigga Official T-Shirt', 'Premium quality cotton t-shirt with Erigga logo', 8000, 'apparel', 500),
('Paper Boi Cap', 'Stylish cap with Paper Boi branding', 5000, 'accessories', 300),
('Erigga Live Hoodie', 'Comfortable hoodie for true fans', 15000, 'apparel', 200);

-- Fixed jsonb insertion by using proper JSONB format
INSERT INTO public.audit_logs (action, table_name, new_values) 
VALUES ('schema_creation', 'system', '{"message": "Complete Erigga Live production schema created successfully", "timestamp": "' || NOW() || '"}');
