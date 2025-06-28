-- Comprehensive Backend Integration Script for Erigga Live Platform
-- This script ensures all necessary tables, functions, and policies are in place
-- Fixed version with proper type handling

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('purchase', 'withdrawal', 'reward', 'content_access', 'refund', 'bonus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('paystack', 'flutterwave', 'crypto', 'coins', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('video', 'audio', 'image', 'document', 'live_stream');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('bars', 'story', 'event', 'general', 'announcement', 'poll');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('system', 'content', 'social', 'payment', 'event', 'tier_upgrade');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table (main user table) with uuid reference
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id bigint primary key generated always as identity,
    auth_user_id uuid references auth.users(id) on delete cascade unique,
    username text unique not null check (length(username) >= 3),
    full_name text not null check (length(full_name) >= 1),
    email text unique not null,
    avatar_url text,
    cover_image_url text,
    tier user_tier default 'grassroot',
    role user_role default 'user',
    level integer default 1 check (level > 0),
    points integer default 0 check (points >= 0),
    coins integer default 0 check (coins >= 0),
    erigga_id text unique,
    bio text,
    location text,
    wallet_address text,
    phone_number text,
    date_of_birth date,
    gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
    is_verified boolean default false,
    is_active boolean default true,
    is_banned boolean default false,
    ban_reason text,
    banned_until timestamp with time zone,
    last_login timestamp with time zone,
    login_count integer default 0,
    referral_code text unique,
    referred_by bigint references public.user_profiles(id),
    subscription_expires_at timestamp with time zone,
    email_verified boolean default false,
    phone_verified boolean default false,
    two_factor_enabled boolean default false,
    two_factor_secret text,
    preferences jsonb default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create community categories table
CREATE TABLE IF NOT EXISTS public.community_categories (
    id bigint primary key generated always as identity,
    name text not null check (length(name) >= 1),
    slug text unique not null,
    description text,
    icon text,
    color text,
    is_active boolean default true,
    sort_order integer default 0,
    created_at timestamp with time zone default now()
);

-- Create community posts table with uuid user reference
CREATE TABLE IF NOT EXISTS public.community_posts (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) on delete cascade,
    category_id bigint references public.community_categories(id) on delete set null,
    content text not null check (length(content) >= 1),
    type post_type default 'general',
    media_url text,
    media_type content_type,
    media_metadata jsonb default '{}',
    vote_count integer default 0 check (vote_count >= 0),
    comment_count integer default 0 check (comment_count >= 0),
    share_count integer default 0 check (share_count >= 0),
    view_count integer default 0 check (view_count >= 0),
    tags text[] default '{}',
    mentions jsonb default '[]',
    is_featured boolean default false,
    is_pinned boolean default false,
    is_published boolean default true,
    is_edited boolean default false,
    is_deleted boolean default false,
    deleted_at timestamp with time zone,
    scheduled_at timestamp with time zone,
    expires_at timestamp with time zone,
    location text,
    mood text,
    hashtags text[] default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create community post votes table with uuid user reference
CREATE TABLE IF NOT EXISTS public.community_post_votes (
    post_id bigint references public.community_posts(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    primary key (post_id, user_id)
);

-- Create community comments table with uuid user reference
CREATE TABLE IF NOT EXISTS public.community_comments (
    id bigint primary key generated always as identity,
    post_id bigint references public.community_posts(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    parent_comment_id bigint references public.community_comments(id) on delete cascade,
    content text not null check (length(content) >= 1),
    like_count integer default 0 check (like_count >= 0),
    reply_count integer default 0 check (reply_count >= 0),
    is_edited boolean default false,
    is_deleted boolean default false,
    deleted_at timestamp with time zone,
    mentions jsonb default '[]',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create community comment likes table with uuid user reference
CREATE TABLE IF NOT EXISTS public.community_comment_likes (
    comment_id bigint references public.community_comments(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    primary key (comment_id, user_id)
);

-- Create coin transactions table with uuid user reference
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) on delete cascade,
    amount integer not null,
    transaction_type transaction_type not null,
    payment_method payment_method,
    reference_id text unique,
    external_reference text,
    status payment_status default 'pending',
    description text,
    metadata jsonb default '{}',
    fee_amount integer default 0,
    net_amount integer,
    currency text default 'NGN',
    exchange_rate numeric default 1.0,
    processed_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason text,
    refunded_at timestamp with time zone,
    refund_reason text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id bigint primary key generated always as identity,
    name text not null check (length(name) >= 1),
    slug text unique not null,
    description text,
    short_description text,
    price integer not null check (price >= 0),
    compare_at_price integer,
    cost_price integer,
    images text[] default '{}',
    thumbnail_url text,
    sizes text[] default '{}',
    colors text[] default '{}',
    category text,
    subcategory text,
    brand text default 'Erigga',
    sku text unique,
    barcode text,
    is_premium_only boolean default false,
    required_tier user_tier,
    coin_price integer default 0,
    stock_quantity integer default 0 check (stock_quantity >= 0),
    low_stock_threshold integer default 5,
    weight numeric,
    dimensions jsonb default '{}',
    is_active boolean default true,
    is_featured boolean default false,
    is_digital boolean default false,
    requires_shipping boolean default true,
    tax_rate numeric default 0.0,
    tags text[] default '{}',
    seo_title text,
    seo_description text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create notifications table with uuid user reference
CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) on delete cascade,
    type notification_type not null,
    title text not null,
    message text not null,
    data jsonb default '{}',
    is_read boolean default false,
    is_sent boolean default false,
    sent_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON public.user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_published ON public.community_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_deleted ON public.community_posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_comment_id ON public.community_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_status ON public.coin_transactions(status);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON public.coin_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with proper uuid handling

-- User profiles policies
CREATE POLICY "Users can view all active profiles" ON public.user_profiles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Community categories policies
CREATE POLICY "Categories are viewable by everyone" ON public.community_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage categories" ON public.community_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Community posts policies
CREATE POLICY "Posts are viewable by everyone" ON public.community_posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

CREATE POLICY "Users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posts" ON public.community_posts
    FOR UPDATE USING (user_id = auth.uid());

-- Community post votes policies
CREATE POLICY "Users can manage their own votes" ON public.community_post_votes
    FOR ALL USING (user_id = auth.uid());

-- Community comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.community_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON public.community_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Community comment likes policies
CREATE POLICY "Users can manage their own comment likes" ON public.community_comment_likes
    FOR ALL USING (user_id = auth.uid());

-- Coin transactions policies
CREATE POLICY "Users can view their own transactions" ON public.coin_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create transactions" ON public.coin_transactions
    FOR INSERT WITH CHECK (true);

-- Products policies
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Create helper functions
CREATE OR REPLACE FUNCTION get_or_create_user_profile(user_auth_id uuid)
RETURNS public.user_profiles AS $$
DECLARE
    user_profile public.user_profiles;
    auth_user auth.users;
BEGIN
    -- First, try to get existing profile
    SELECT * INTO user_profile
    FROM public.user_profiles
    WHERE auth_user_id = user_auth_id;
    
    -- If profile exists, return it
    IF FOUND THEN
        RETURN user_profile;
    END IF;
    
    -- Get auth user details
    SELECT * INTO auth_user
    FROM auth.users
    WHERE id = user_auth_id;
    
    -- If auth user doesn't exist, return null
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Create new profile
    INSERT INTO public.user_profiles (
        auth_user_id,
        username,
        full_name,
        email,
        email_verified
    ) VALUES (
        user_auth_id,
        COALESCE(auth_user.raw_user_meta_data->>'username', split_part(auth_user.email, '@', 1)),
        COALESCE(auth_user.raw_user_meta_data->>'full_name', split_part(auth_user.email, '@', 1)),
        auth_user.email,
        auth_user.email_confirmed_at IS NOT NULL
    ) RETURNING * INTO user_profile;
    
    RETURN user_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at 
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_comments_updated_at ON public.community_comments;
CREATE TRIGGER update_community_comments_updated_at 
    BEFORE UPDATE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coin_transactions_updated_at ON public.coin_transactions;
CREATE TRIGGER update_coin_transactions_updated_at 
    BEFORE UPDATE ON public.coin_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default community categories
INSERT INTO public.community_categories (name, slug, description, icon, color) VALUES
('General Discussion', 'general', 'General discussions about Erigga and music', '💬', '#6B7280'),
('Bars & Lyrics', 'bars', 'Share and discuss your favorite bars and lyrics', '🎤', '#F59E0B'),
('Events & Shows', 'events', 'Upcoming events, concerts, and shows', '🎪', '#EF4444'),
('Fan Art & Creativity', 'fan-art', 'Share your creative works inspired by Erigga', '🎨', '#8B5CF6'),
('Music Reviews', 'reviews', 'Reviews and discussions about tracks and albums', '⭐', '#10B981'),
('Street Chronicles', 'chronicles', 'Stories and experiences from the streets', '📖', '#F97316')
ON CONFLICT (slug) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create storage bucket for assets (if not exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('eriggalive-assets', 'eriggalive-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Public can view assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'eriggalive-assets');

CREATE POLICY "Authenticated users can upload assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'eriggalive-assets' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'eriggalive-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'eriggalive-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
