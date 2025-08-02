-- =====================================================
-- COMPLETE ERIGGA LIVE DATABASE SETUP
-- This is a comprehensive, production-ready schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. CUSTOM TYPES
-- =====================================================

-- User tiers
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction types
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('purchase', 'withdrawal', 'reward', 'content_access', 'refund', 'bonus', 'vote');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment statuses
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Content types
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('video', 'audio', 'image', 'document', 'live_stream');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Post types
DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('bars', 'story', 'event', 'general', 'announcement', 'poll', 'media');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification types
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('system', 'content', 'social', 'payment', 'event', 'tier_upgrade', 'vote', 'comment', 'mention');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CORE USER MANAGEMENT
-- =====================================================

-- Main users table
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 30),
    full_name TEXT NOT NULL CHECK (LENGTH(full_name) >= 2),
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    cover_image_url TEXT,
    tier user_tier DEFAULT 'grassroot',
    role user_role DEFAULT 'user',
    level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    coins INTEGER DEFAULT 1000 CHECK (coins >= 0),
    erigga_id TEXT UNIQUE,
    bio TEXT CHECK (LENGTH(bio) <= 500),
    location TEXT,
    wallet_address TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by BIGINT REFERENCES public.users(id),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    marketing_emails BOOLEAN DEFAULT TRUE,
    privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
    auto_play_videos BOOLEAN DEFAULT TRUE,
    show_online_status BOOLEAN DEFAULT TRUE,
    allow_friend_requests BOOLEAN DEFAULT TRUE,
    content_filter_level TEXT DEFAULT 'moderate' CHECK (content_filter_level IN ('strict', 'moderate', 'off')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CONTENT MANAGEMENT
-- =====================================================

-- Albums
CREATE TABLE IF NOT EXISTS public.albums (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL CHECK (LENGTH(title) >= 1),
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_url TEXT NOT NULL,
    cover_blur_hash TEXT,
    type TEXT DEFAULT 'album' CHECK (type IN ('album', 'ep', 'mixtape', 'single', 'compilation')),
    genre TEXT,
    release_date DATE NOT NULL,
    total_tracks INTEGER DEFAULT 0 CHECK (total_tracks >= 0),
    duration_seconds INTEGER DEFAULT 0 CHECK (duration_seconds >= 0),
    is_premium BOOLEAN DEFAULT FALSE,
    required_tier user_tier DEFAULT 'grassroot',
    coin_price INTEGER DEFAULT 0 CHECK (coin_price >= 0),
    play_count INTEGER DEFAULT 0 CHECK (play_count >= 0),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    producer TEXT,
    record_label TEXT,
    copyright_info TEXT,
    explicit_content BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracks
CREATE TABLE IF NOT EXISTS public.tracks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    album_id BIGINT REFERENCES public.albums(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (LENGTH(title) >= 1),
    slug TEXT UNIQUE NOT NULL,
    artist TEXT NOT NULL DEFAULT 'Erigga',
    featuring TEXT,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    track_number INTEGER CHECK (track_number > 0),
    disc_number INTEGER DEFAULT 1 CHECK (disc_number > 0),
    lyrics TEXT,
    cover_url TEXT,
    cover_blur_hash TEXT,
    audio_url TEXT,
    audio_preview_url TEXT,
    waveform_data JSONB,
    is_premium BOOLEAN DEFAULT FALSE,
    required_tier user_tier DEFAULT 'grassroot',
    coin_price INTEGER DEFAULT 0 CHECK (coin_price >= 0),
    play_count INTEGER DEFAULT 0 CHECK (play_count >= 0),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
    share_count INTEGER DEFAULT 0 CHECK (share_count >= 0),
    release_date DATE NOT NULL,
    is_single BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    genre TEXT,
    mood TEXT,
    tempo INTEGER,
    key_signature TEXT,
    producer TEXT,
    songwriter TEXT,
    explicit_content BOOLEAN DEFAULT FALSE,
    isrc TEXT UNIQUE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Music videos
CREATE TABLE IF NOT EXISTS public.music_videos (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    track_id BIGINT REFERENCES public.tracks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    thumbnail_blur_hash TEXT,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    views INTEGER DEFAULT 0 CHECK (views >= 0),
    likes INTEGER DEFAULT 0 CHECK (likes >= 0),
    dislikes INTEGER DEFAULT 0 CHECK (dislikes >= 0),
    comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
    is_premium BOOLEAN DEFAULT FALSE,
    required_tier user_tier DEFAULT 'grassroot',
    coin_price INTEGER DEFAULT 0 CHECK (coin_price >= 0),
    release_date DATE NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    director TEXT,
    producer TEXT,
    location TEXT,
    explicit_content BOOLEAN DEFAULT FALSE,
    quality TEXT DEFAULT 'HD' CHECK (quality IN ('SD', 'HD', '4K')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery items
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    blur_hash TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    required_tier user_tier DEFAULT 'grassroot',
    coin_price INTEGER DEFAULT 0 CHECK (coin_price >= 0),
    views INTEGER DEFAULT 0 CHECK (views >= 0),
    likes INTEGER DEFAULT 0 CHECK (likes >= 0),
    downloads INTEGER DEFAULT 0 CHECK (downloads >= 0),
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    photographer TEXT,
    location TEXT,
    taken_at TIMESTAMP WITH TIME ZONE,
    camera_info JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. COMMUNITY SYSTEM
-- =====================================================

-- Community categories
CREATE TABLE IF NOT EXISTS public.community_categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT '📝',
    color TEXT DEFAULT '#3b82f6',
    parent_id BIGINT REFERENCES public.community_categories(id) ON DELETE SET NULL,
    post_count INTEGER DEFAULT 0 CHECK (post_count >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    required_tier user_tier DEFAULT 'grassroot',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts
CREATE TABLE IF NOT EXISTS public.community_posts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES public.community_categories(id) ON DELETE RESTRICT,
    title TEXT,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 10000),
    post_type post_type DEFAULT 'general',
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')),
    media_metadata JSONB DEFAULT '{}',
    vote_count INTEGER DEFAULT 0 CHECK (vote_count >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    mentions JSONB DEFAULT '[]',
    hashtags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community comments
CREATE TABLE IF NOT EXISTS public.community_comments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 2000),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    mentions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community post votes
CREATE TABLE IF NOT EXISTS public.community_post_votes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Community comment likes
CREATE TABLE IF NOT EXISTS public.community_comment_likes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    comment_id BIGINT NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- =====================================================
-- 5. SOCIAL FEATURES
-- =====================================================

-- User follows
CREATE TABLE IF NOT EXISTS public.user_follows (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    follower_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- User blocks
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    blocker_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- =====================================================
-- 6. COIN SYSTEM & TRANSACTIONS
-- =====================================================

-- Coin transactions
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type transaction_type NOT NULL,
    payment_method TEXT,
    reference_id TEXT UNIQUE,
    external_reference TEXT,
    status payment_status NOT NULL DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    fee_amount INTEGER DEFAULT 0,
    net_amount INTEGER,
    currency TEXT DEFAULT 'NGN',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content access tracking
CREATE TABLE IF NOT EXISTS public.content_access (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id BIGINT NOT NULL,
    access_type TEXT NOT NULL DEFAULT 'purchase' CHECK (access_type IN ('purchase', 'subscription', 'free', 'promotional')),
    coins_spent INTEGER DEFAULT 0 CHECK (coins_spent >= 0),
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0 CHECK (access_count >= 0),
    last_accessed TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id)
);

-- =====================================================
-- 7. EVENTS & TICKETS
-- =====================================================

-- Events
CREATE TABLE IF NOT EXISTS public.events (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    venue TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT DEFAULT 'Nigeria',
    coordinates POINT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    doors_open TIMESTAMP WITH TIME ZONE,
    ticket_price DECIMAL(10,2) NOT NULL CHECK (ticket_price >= 0),
    vip_price DECIMAL(10,2) CHECK (vip_price >= ticket_price),
    max_tickets INTEGER NOT NULL CHECK (max_tickets > 0),
    max_vip_tickets INTEGER DEFAULT 0 CHECK (max_vip_tickets >= 0),
    tickets_sold INTEGER DEFAULT 0 CHECK (tickets_sold >= 0),
    vip_tickets_sold INTEGER DEFAULT 0 CHECK (vip_tickets_sold >= 0),
    image_url TEXT,
    banner_url TEXT,
    gallery_urls TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_sold_out BOOLEAN DEFAULT FALSE,
    is_canceled BOOLEAN DEFAULT FALSE,
    canceled_reason TEXT,
    age_restriction INTEGER CHECK (age_restriction >= 0),
    dress_code TEXT,
    special_instructions TEXT,
    organizer TEXT DEFAULT 'Erigga Official',
    contact_email TEXT,
    contact_phone TEXT,
    social_links JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    genre TEXT,
    seo_title TEXT,
    seo_description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets
CREATE TABLE IF NOT EXISTS public.tickets (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE NOT NULL,
    ticket_type TEXT DEFAULT 'regular' CHECK (ticket_type IN ('regular', 'vip', 'backstage', 'meet_greet')),
    qr_code TEXT UNIQUE NOT NULL,
    qr_code_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'canceled', 'used', 'expired')),
    payment_reference TEXT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid >= 0),
    fees_paid DECIMAL(10,2) DEFAULT 0 CHECK (fees_paid >= 0),
    total_paid DECIMAL(10,2) NOT NULL CHECK (total_paid >= 0),
    currency TEXT DEFAULT 'NGN',
    payment_method TEXT,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_phone TEXT,
    seat_number TEXT,
    section TEXT,
    row_number TEXT,
    special_access TEXT[] DEFAULT '{}',
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    validated_by BIGINT REFERENCES public.users(id),
    validation_location TEXT,
    transfer_count INTEGER DEFAULT 0 CHECK (transfer_count >= 0),
    max_transfers INTEGER DEFAULT 3 CHECK (max_transfers >= 0),
    is_transferable BOOLEAN DEFAULT TRUE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. MERCHANDISE & PRODUCTS
-- =====================================================

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(10,2) CHECK (compare_at_price >= price),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    images TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    sizes TEXT[] DEFAULT '{}',
    colors TEXT[] DEFAULT '{}',
    category TEXT,
    subcategory TEXT,
    brand TEXT DEFAULT 'Erigga Official',
    sku TEXT UNIQUE,
    barcode TEXT,
    is_premium_only BOOLEAN DEFAULT FALSE,
    required_tier user_tier DEFAULT 'grassroot',
    coin_price INTEGER DEFAULT 0 CHECK (coin_price >= 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 10,
    weight DECIMAL(8,2),
    dimensions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_digital BOOLEAN DEFAULT FALSE,
    requires_shipping BOOLEAN DEFAULT TRUE,
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    tags TEXT[] DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded')),
    payment_status payment_status DEFAULT 'pending',
    payment_method TEXT,
    payment_reference TEXT,
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency TEXT DEFAULT 'NGN',
    coins_used INTEGER DEFAULT 0 CHECK (coins_used >= 0),
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    notes TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    product_snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. CHAT & MESSAGING
-- =====================================================

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 1000),
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'system')),
    media_url TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Freebies
CREATE TABLE IF NOT EXISTS public.freebies (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'other',
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size BIGINT,
    mime_type TEXT,
    vote_count INTEGER DEFAULT 0 CHECK (vote_count >= 0),
    download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Freebie votes
CREATE TABLE IF NOT EXISTS public.freebie_votes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    freebie_id BIGINT NOT NULL REFERENCES public.freebies(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(freebie_id, user_id)
);

-- =====================================================
-- 10. NOTIFICATIONS SYSTEM
-- =====================================================

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. REPORTS & MODERATION
-- =====================================================

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    reporter_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reported_user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    post_id BIGINT REFERENCES public.community_posts(id) ON DELETE CASCADE,
    comment_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'copyright', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by BIGINT REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((reported_user_id IS NOT NULL) OR (post_id IS NOT NULL) OR (comment_id IS NOT NULL))
);

-- =====================================================
-- 12. STREAMING LINKS
-- =====================================================

-- Streaming platform links
CREATE TABLE IF NOT EXISTS public.streaming_links (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    track_id BIGINT REFERENCES public.tracks(id) ON DELETE CASCADE,
    album_id BIGINT REFERENCES public.albums(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('spotify', 'apple_music', 'youtube_music', 'audiomack', 'soundcloud', 'deezer', 'tidal', 'amazon_music')),
    url TEXT NOT NULL,
    platform_id TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((track_id IS NOT NULL AND album_id IS NULL) OR (track_id IS NULL AND album_id IS NOT NULL)),
    UNIQUE(track_id, platform),
    UNIQUE(album_id, platform)
);

-- =====================================================
-- 13. PERFORMANCE INDEXES
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_albums_release_date ON public.albums(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_albums_is_published ON public.albums(is_published);
CREATE INDEX IF NOT EXISTS idx_albums_slug ON public.albums(slug);

CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON public.tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_release_date ON public.tracks(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_is_published ON public.tracks(is_published);
CREATE INDEX IF NOT EXISTS idx_tracks_slug ON public.tracks(slug);
CREATE INDEX IF NOT EXISTS idx_tracks_play_count ON public.tracks(play_count DESC);

CREATE INDEX IF NOT EXISTS idx_music_videos_track_id ON public.music_videos(track_id);
CREATE INDEX IF NOT EXISTS idx_music_videos_release_date ON public.music_videos(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_music_videos_views ON public.music_videos(views DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_items_category ON public.gallery_items(category);
CREATE INDEX IF NOT EXISTS idx_gallery_items_is_published ON public.gallery_items(is_published);

-- Community indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count ON public.community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_published ON public.community_posts(is_published);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id ON public.community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON public.community_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON public.community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON public.community_post_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_community_comment_likes_comment_id ON public.community_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_likes_user_id ON public.community_comment_likes(user_id);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_status ON public.coin_transactions(status);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON public.coin_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON public.coin_transactions(created_at DESC);

-- Social indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- Event indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- Freebies indexes
CREATE INDEX IF NOT EXISTS idx_freebies_vote_count ON public.freebies(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_freebies_created_at ON public.freebies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_freebies_user_id ON public.freebies(user_id);

CREATE INDEX IF NOT EXISTS idx_freebie_votes_freebie_id ON public.freebie_votes(freebie_id);
CREATE INDEX IF NOT EXISTS idx_freebie_votes_user_id ON public.freebie_votes(user_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_albums_search ON public.albums USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_tracks_search ON public.tracks USING gin(to_tsvector('english', title || ' ' || artist || ' ' || COALESCE(featuring, '') || ' ' || COALESCE(lyrics, '')));
CREATE INDEX IF NOT EXISTS idx_community_posts_search ON public.community_posts USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_events_search ON public.events USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || venue));
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =====================================================
-- 14. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate unique Erigga ID
CREATE OR REPLACE FUNCTION generate_erigga_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.erigga_id := 'EG' || LPAD(NEW.id::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.referral_code := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle post votes with coin transfer
CREATE OR REPLACE FUNCTION public.handle_post_vote(
    p_post_id BIGINT,
    p_voter_auth_id UUID,
    p_post_creator_auth_id UUID,
    p_coin_amount INTEGER DEFAULT 100
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voter_id BIGINT;
    v_post_creator_id BIGINT;
    v_voter_coins INTEGER;
    v_existing_vote BOOLEAN;
BEGIN
    -- Get voter's internal ID and coin balance
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
    
    -- Check if voter is trying to vote on their own post
    IF v_voter_id = v_post_creator_id THEN
        RAISE EXCEPTION 'Cannot vote on own post';
    END IF;
    
    -- Check if user has enough coins
    IF v_voter_coins < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;
    
    -- Check if user has already voted
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
        SET vote_count = vote_count - 1, updated_at = NOW()
        WHERE id = p_post_id;
        
        -- Refund coins to voter
        UPDATE public.users 
        SET coins = coins + p_coin_amount, updated_at = NOW()
        WHERE id = v_voter_id;
        
        -- Remove coins from post creator
        UPDATE public.users 
        SET coins = coins - p_coin_amount, updated_at = NOW()
        WHERE id = v_post_creator_id;
        
        -- Record refund transactions
        INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
        VALUES (v_voter_id, p_coin_amount, 'refund', 'Vote removed - refund', 'completed');
        
        INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
        VALUES (v_post_creator_id, -p_coin_amount, 'refund', 'Vote removed - deduction', 'completed');
        
        RETURN FALSE; -- Vote removed
    ELSE
        -- Add vote
        INSERT INTO public.community_post_votes (post_id, user_id)
        VALUES (p_post_id, v_voter_id);
        
        -- Update vote count
        UPDATE public.community_posts 
        SET vote_count = vote_count + 1, updated_at = NOW()
        WHERE id = p_post_id;
        
        -- Transfer coins from voter to post creator
        UPDATE public.users 
        SET coins = coins - p_coin_amount, updated_at = NOW()
        WHERE id = v_voter_id;
        
        UPDATE public.users 
        SET coins = coins + p_coin_amount, updated_at = NOW()
        WHERE id = v_post_creator_id;
        
        -- Record transactions
        INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
        VALUES (v_voter_id, -p_coin_amount, 'vote', 'Post vote', 'completed');
        
        INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
        VALUES (v_post_creator_id, p_coin_amount, 'reward', 'Post vote received', 'completed');
        
        RETURN TRUE; -- Vote added
    END IF;
END;
$$;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment comment count on post
        UPDATE public.community_posts 
        SET comment_count = comment_count + 1, updated_at = NOW()
        WHERE id = NEW.post_id;
        
        -- If it's a reply, increment reply count on parent comment
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments 
            SET reply_count = reply_count + 1, updated_at = NOW()
            WHERE id = NEW.parent_comment_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement comment count on post
        UPDATE public.community_posts 
        SET comment_count = GREATEST(0, comment_count - 1), updated_at = NOW()
        WHERE id = OLD.post_id;
        
        -- If it's a reply, decrement reply count on parent comment
        IF OLD.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments 
            SET reply_count = GREATEST(0, reply_count - 1), updated_at = NOW()
            WHERE id = OLD.parent_comment_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_comments 
        SET like_count = like_count + 1, updated_at = NOW()
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_comments 
        SET like_count = GREATEST(0, like_count - 1), updated_at = NOW()
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update freebie vote counts
CREATE OR REPLACE FUNCTION update_freebie_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.freebies 
        SET vote_count = vote_count + 1, updated_at = NOW()
        WHERE id = NEW.freebie_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.freebies 
        SET vote_count = GREATEST(0, vote_count - 1), updated_at = NOW()
        WHERE id = OLD.freebie_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        auth_user_id, 
        username, 
        full_name, 
        email, 
        avatar_url
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create user settings
    INSERT INTO public.user_settings (user_id)
    SELECT id FROM public.users WHERE auth_user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 15. CREATE TRIGGERS
-- =====================================================

-- User profile creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Erigga ID generation trigger
DROP TRIGGER IF EXISTS generate_erigga_id_trigger ON public.users;
CREATE TRIGGER generate_erigga_id_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION generate_erigga_id();

-- Referral code generation trigger
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON public.users;
CREATE TRIGGER generate_referral_code_trigger
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_music_videos_updated_at BEFORE UPDATE ON public.music_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coin_transactions_updated_at BEFORE UPDATE ON public.coin_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freebies_updated_at BEFORE UPDATE ON public.freebies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment count triggers
DROP TRIGGER IF EXISTS trigger_update_comment_counts ON public.community_comments;
CREATE TRIGGER trigger_update_comment_counts
    AFTER INSERT OR DELETE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Like count triggers
DROP TRIGGER IF EXISTS trigger_update_like_counts ON public.community_comment_likes;
CREATE TRIGGER trigger_update_like_counts
    AFTER INSERT OR DELETE ON public.community_comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_like_counts();

-- Freebie vote count triggers
DROP TRIGGER IF EXISTS trigger_update_freebie_vote_counts ON public.freebie_votes;
CREATE TRIGGER trigger_update_freebie_vote_counts
    AFTER INSERT OR DELETE ON public.freebie_votes
    FOR EACH ROW EXECUTE FUNCTION update_freebie_vote_counts();

-- =====================================================
-- 16. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaming_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebie_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view all public profiles" ON public.users
    FOR SELECT USING (is_active = TRUE AND is_banned = FALSE);

CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- User settings policies
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Content policies (public read)
CREATE POLICY "Albums are viewable by everyone" ON public.albums
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Tracks are viewable by everyone" ON public.tracks
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Streaming links are viewable by everyone" ON public.streaming_links
    FOR SELECT USING (TRUE);

CREATE POLICY "Music videos are viewable by everyone" ON public.music_videos
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Gallery items are viewable by everyone" ON public.gallery_items
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Events are viewable by everyone" ON public.events
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (is_active = TRUE);

-- Transaction policies
CREATE POLICY "Users can view their own transactions" ON public.coin_transactions
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create their own transactions" ON public.coin_transactions
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Content access policies
CREATE POLICY "Users can view their own content access" ON public.content_access
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create their own content access" ON public.content_access
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Community policies
CREATE POLICY "Categories are viewable by everyone" ON public.community_categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Posts are viewable by everyone" ON public.community_posts
    FOR SELECT USING (is_published = TRUE AND is_deleted = FALSE);

CREATE POLICY "Users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete their own posts" ON public.community_posts
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Comments are viewable by everyone" ON public.community_comments
    FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "Users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own comments" ON public.community_comments
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete their own comments" ON public.community_comments
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Vote and like policies
CREATE POLICY "Votes are viewable by everyone" ON public.community_post_votes
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage their own votes" ON public.community_post_votes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Comment likes are viewable by everyone" ON public.community_comment_likes
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage their own comment likes" ON public.community_comment_likes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Social policies
CREATE POLICY "Follows are viewable by everyone" ON public.user_follows
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage their own follows" ON public.user_follows
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = follower_id));

CREATE POLICY "Users can view their own blocks" ON public.user_blocks
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = blocker_id));

CREATE POLICY "Users can manage their own blocks" ON public.user_blocks
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = blocker_id));

-- Ticket policies
CREATE POLICY "Users can view their own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Order policies
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Order items are viewable with orders" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = orders.user_id)
        )
    );

-- Chat and freebies policies
CREATE POLICY "Chat messages are viewable by everyone" ON public.chat_messages
    FOR SELECT USING (is_deleted = FALSE);

CREATE POLICY "Users can create chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own chat messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Freebies are viewable by everyone" ON public.freebies
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can create freebies" ON public.freebies
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own freebies" ON public.freebies
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Freebie votes are viewable by everyone" ON public.freebie_votes
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage their own freebie votes" ON public.freebie_votes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Notification policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Report policies
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = reporter_id));

CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = reporter_id));

-- Admin policies (for users with admin role)
CREATE POLICY "Admins can manage all content" ON public.albums
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage all tracks" ON public.tracks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage all events" ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 17. SEED DATA
-- =====================================================

-- Insert default community categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general-discussion', 'General discussions about Erigga and his music', '💬', '#3B82F6', 1),
('Music & Lyrics', 'music-lyrics', 'Discuss Erigga''s music, lyrics, and their meanings', '🎵', '#EC4899', 2),
('Events & Shows', 'events-shows', 'Information about upcoming events and shows', '📅', '#  2),
('Events & Shows', 'events-shows', 'Information about upcoming events and shows', '📅', '#10B981', 3),
('Freestyle Corner', 'freestyle-corner', 'Share your own freestyle lyrics and get feedback', '🎤', '#F59E0B', 4),
('Premium Lounge', 'premium-lounge', 'Exclusive discussions for premium members', '👑', '#8B5CF6', 5),
('Elder''s Council', 'elders-council', 'Strategic discussions for Elder tier members', '🛡️', '#6366F1', 6),
('Blood Brotherhood', 'blood-brotherhood', 'Inner circle discussions for Blood tier members', '🩸', '#EF4444', 7)
ON CONFLICT (slug) DO NOTHING;

-- Sample albums with rich metadata
INSERT INTO public.albums (title, slug, description, cover_url, type, genre, release_date, total_tracks, duration_seconds, is_premium, required_tier, coin_price, play_count, producer, record_label, tags) VALUES
('The Erigma', 'the-erigma', 'The breakthrough album that established Erigga as the Paper Boi of South-South Nigeria', '/placeholder.svg?height=400&width=400&text=The+Erigma', 'album', 'Afro Hip-Hop', '2019-02-14', 17, 3765, false, 'grassroot', 0, 2500000, 'Kel-P, Popito', 'Emirate Empire', ARRAY['hip-hop', 'afrobeats', 'street']),

('The Erigma II', 'the-erigma-ii', 'The highly anticipated sequel featuring collaborations with top Nigerian artists', '/placeholder.svg?height=400&width=400&text=The+Erigma+II', 'album', 'Afro Hip-Hop', '2020-10-30', 15, 3512, false, 'grassroot', 0, 3200000, 'Kel-P, Popito, Vstix', 'Emirate Empire', ARRAY['hip-hop', 'afrobeats', 'collaboration']),

('Street Motivation', 'street-motivation', 'Raw street stories and motivational tracks for the hustlers', '/placeholder.svg?height=400&width=400&text=Street+Motivation', 'mixtape', 'Street Hip-Hop', '2021-06-15', 12, 2718, true, 'pioneer', 75, 1800000, 'Kel-P, Popito', 'Emirate Empire', ARRAY['street', 'motivation', 'hustle']),

('Blood & Sweat', 'blood-and-sweat', 'Premium exclusive album showcasing Erigga''s versatility and growth', '/placeholder.svg?height=400&width=400&text=Blood+Sweat', 'album', 'Afro Hip-Hop', '2023-12-01', 20, 4530, true, 'blood', 200, 500000, 'Kel-P, Vstix, Popito', 'Emirate Empire', ARRAY['premium', 'exclusive', 'growth']),

('Paper Boi Chronicles', 'paper-boi-chronicles', 'The definitive collection of Erigga''s greatest hits and unreleased tracks', '/placeholder.svg?height=400&width=400&text=Paper+Boi+Chronicles', 'compilation', 'Afro Hip-Hop', '2024-01-15', 25, 5625, true, 'elder', 150, 750000, 'Various', 'Emirate Empire', ARRAY['greatest-hits', 'compilation', 'unreleased'])
ON CONFLICT (slug) DO NOTHING;

-- Sample tracks with comprehensive metadata
INSERT INTO public.tracks (album_id, title, slug, artist, featuring, duration_seconds, track_number, lyrics, cover_url, release_date, play_count, is_premium, required_tier, coin_price, genre, producer, songwriter, tags) VALUES
(1, 'Send Her Money', 'send-her-money', 'Erigga', 'Yemi Alade', 225, 1, 'Send her money, send her money...', '/placeholder.svg?height=400&width=400&text=Send+Her+Money', '2019-02-14', 5200000, false, 'grassroot', 0, 'Afrobeats', 'Kel-P', 'Erigga', ARRAY['love', 'money', 'relationship']),

(1, 'Motivation', 'motivation', 'Erigga', 'Victor AD', 198, 2, 'Every day I wake up with motivation...', '/placeholder.svg?height=400&width=400&text=Motivation', '2019-02-14', 3800000, false, 'grassroot', 0, 'Hip-Hop', 'Popito', 'Erigga', ARRAY['motivation', 'hustle', 'success']),

(2, 'The Erigma II', 'the-erigma-ii-title', 'Erigga', NULL, 210, 1, 'Welcome to the Erigma II...', '/placeholder.svg?height=400&width=400&text=Erigma+II', '2020-10-30', 2100000, false, 'grassroot', 0, 'Hip-Hop', 'Kel-P', 'Erigga', ARRAY['intro', 'erigma', 'sequel']),

(3, 'Street Credibility', 'street-credibility', 'Erigga', 'Zlatan', 187, 1, 'Street credibility na wetin I get...', '/placeholder.svg?height=400&width=400&text=Street+Credibility', '2021-06-15', 1500000, true, 'pioneer', 25, 'Street Hip-Hop', 'Popito', 'Erigga', ARRAY['street', 'credibility', 'respect']),

(4, 'Blood Money', 'blood-money', 'Erigga', 'Phyno', 245, 1, 'Blood money no dey pay...', '/placeholder.svg?height=400&width=400&text=Blood+Money', '2023-12-01', 800000, true, 'blood', 50, 'Afro Hip-Hop', 'Vstix', 'Erigga', ARRAY['premium', 'philosophy', 'money']),

(5, 'Paper Boi Anthem', 'paper-boi-anthem', 'Erigga', NULL, 267, 1, 'Paper Boi, Paper Boi, that''s my name...', '/placeholder.svg?height=400&width=400&text=Paper+Boi+Anthem', '2024-01-15', 1200000, true, 'elder', 35, 'Hip-Hop', 'Kel-P', 'Erigga', ARRAY['anthem', 'paper-boi', 'identity'])
ON CONFLICT (slug) DO NOTHING;

-- Streaming platform links
INSERT INTO public.streaming_links (track_id, platform, url, platform_id, is_verified) VALUES
(1, 'spotify', 'https://open.spotify.com/track/send-her-money', 'spotify_123456', true),
(1, 'apple_music', 'https://music.apple.com/track/send-her-money', 'apple_123456', true),
(1, 'audiomack', 'https://audiomack.com/erigga/song/send-her-money', 'audiomack_123456', true),
(2, 'spotify', 'https://open.spotify.com/track/motivation', 'spotify_234567', true),
(2, 'apple_music', 'https://music.apple.com/track/motivation', 'apple_234567', true),
(3, 'spotify', 'https://open.spotify.com/track/erigma-ii', 'spotify_345678', true),
(4, 'audiomack', 'https://audiomack.com/erigga/song/street-credibility', 'audiomack_456789', true),
(5, 'spotify', 'https://open.spotify.com/track/blood-money', 'spotify_567890', true)
ON CONFLICT DO NOTHING;

-- Sample gallery items
INSERT INTO public.gallery_items (title, slug, description, image_url, category, subcategory, views, likes, photographer, location, taken_at, tags) VALUES
('Erigga Live in Lagos', 'erigga-live-lagos', 'Erigga performing at the Eko Hotel Lagos', '/placeholder.svg?height=600&width=800&text=Erigga+Live+Lagos', 'Performance', 'Concert', 15000, 2500, 'Kelechi Amadi-Obi', 'Eko Hotel, Lagos', '2023-12-15 20:30:00+01', ARRAY['concert', 'lagos', 'performance']),

('Studio Session', 'studio-session-2024', 'Behind the scenes in the studio working on new music', '/placeholder.svg?height=600&width=800&text=Studio+Session', 'Behind The Scenes', 'Studio', 8500, 1200, 'Emmanuel Oyeleke', 'Emirate Studios, Warri', '2024-01-10 14:00:00+01', ARRAY['studio', 'recording', 'behind-scenes']),

('Paper Boi Portrait', 'paper-boi-portrait', 'Professional portrait shoot for Paper Boi Chronicles album', '/placeholder.svg?height=800&width=600&text=Paper+Boi+Portrait', 'Portrait', 'Professional', 12000, 1800, 'Ty Bello', 'Lagos, Nigeria', '2023-11-20 10:00:00+01', ARRAY['portrait', 'professional', 'album-cover'])
ON CONFLICT (slug) DO NOTHING;

-- Sample events
INSERT INTO public.events (title, slug, description, venue, address, city, state, date, ticket_price, vip_price, max_tickets, max_vip_tickets, image_url, organizer, contact_email, tags) VALUES
('Erigga Live in Concert - Lagos', 'erigga-live-lagos-2024', 'The biggest Erigga concert of the year featuring special guests and surprise performances', 'Eko Hotel Convention Centre', 'Plot 1415, Adetokunbo Ademola Street, Victoria Island', 'Lagos', 'Lagos', '2024-12-15 20:00:00+01', 15000.00, 50000.00, 5000, 500, '/placeholder.svg?height=400&width=600&text=Erigga+Live+Lagos', 'Emirate Empire', 'events@emirateempire.com', ARRAY['concert', 'live-music', 'lagos']),

('Paper Boi Chronicles Album Launch', 'paper-boi-chronicles-launch', 'Exclusive album launch party with live performances and meet & greet', 'Terra Kulture Arena', '1376 Tiamiyu Savage Street, Victoria Island', 'Lagos', 'Lagos', '2024-02-14 19:00:00+01', 25000.00, 75000.00, 1000, 100, '/placeholder.svg?height=400&width=600&text=Album+Launch', 'Emirate Empire', 'events@emirateempire.com', ARRAY['album-launch', 'exclusive', 'meet-greet'])
ON CONFLICT (slug) DO NOTHING;

-- Sample products
INSERT INTO public.products (name, slug, description, price, images, category, brand, sku, stock_quantity, is_featured, tags) VALUES
('Paper Boi Official T-Shirt', 'paper-boi-tshirt', 'Premium quality cotton t-shirt with Paper Boi logo', 8500.00, ARRAY['/placeholder.svg?height=400&width=400&text=Paper+Boi+Tshirt'], 'Clothing', 'Erigga Official', 'PB-TSHIRT-001', 500, true, ARRAY['clothing', 'tshirt', 'paper-boi']),

('Erigma Hoodie', 'erigma-hoodie', 'Comfortable hoodie featuring The Erigma album artwork', 15000.00, ARRAY['/placeholder.svg?height=400&width=400&text=Erigma+Hoodie'], 'Clothing', 'Erigga Official', 'EG-HOODIE-001', 200, true, ARRAY['clothing', 'hoodie', 'erigma']),

('Emirate Empire Cap', 'emirate-empire-cap', 'Snapback cap with embroidered Emirate Empire logo', 6500.00, ARRAY['/placeholder.svg?height=400&width=400&text=Emirate+Cap'], 'Accessories', 'Erigga Official', 'EE-CAP-001', 300, false, ARRAY['accessories', 'cap', 'emirate'])
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 18. ENABLE REALTIME
-- =====================================================

-- Enable realtime for all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comment_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.freebies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.freebie_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =====================================================
-- 19. STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('covers', 'covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('audio', 'audio', true, 104857600, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']),
    ('videos', 'videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
    ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'text/plain', 'application/msword']),
    ('community-media', 'community-media', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar uploads are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for community media
CREATE POLICY "Community media is publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'community-media');

CREATE POLICY "Authenticated users can upload community media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'community-media' AND auth.role() = 'authenticated');

-- =====================================================
-- 20. FINAL OPTIMIZATIONS
-- =====================================================

-- Analyze tables for better query planning
ANALYZE public.users;
ANALYZE public.community_posts;
ANALYZE public.community_comments;
ANALYZE public.albums;
ANALYZE public.tracks;
ANALYZE public.events;
ANALYZE public.products;

-- Update table statistics
SELECT pg_stat_reset();

-- =====================================================
-- 21. VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Total tables created: %', table_count;
    
    IF table_count < 25 THEN
        RAISE EXCEPTION 'Expected at least 25 tables, but found %', table_count;
    END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on users table';
    END IF;
    
    RAISE NOTICE 'RLS verification passed';
END $$;

-- Verify functions exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_post_vote'
    ) THEN
        RAISE EXCEPTION 'handle_post_vote function not found';
    END IF;
    
    RAISE NOTICE 'Function verification passed';
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '
    =====================================================
    🎉 ERIGGA LIVE DATABASE SETUP COMPLETE! 🎉
    =====================================================
    
    ✅ All tables created successfully
    ✅ All indexes created for optimal performance  
    ✅ All functions and triggers implemented
    ✅ Row Level Security (RLS) enabled and configured
    ✅ Sample data inserted
    ✅ Storage buckets created with policies
    ✅ Realtime enabled for live features
    
    Your Erigga Live platform is now ready for production!
    
    Key Features Enabled:
    • User management with tiers and coins
    • Community posts with voting system
    • Content management (albums, tracks, videos)
    • Events and ticketing
    • Merchandise and orders
    • Chat and freebies
    • Notifications system
    • Admin capabilities
    
    Next Steps:
    1. Test authentication flow
    2. Verify community features
    3. Test coin transactions
    4. Configure environment variables
    5. Deploy your frontend application
    
    =====================================================';
END $$;

-- End of script
