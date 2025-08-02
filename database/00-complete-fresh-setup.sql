-- =====================================================
-- COMPLETE FRESH SUPABASE SETUP FOR ERIGGA LIVE
-- This is the COMPLETE backend setup script
-- Run this on a FRESH Supabase project
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. CUSTOM TYPES AND ENUMS
-- =====================================================

CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete', 'trialing');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'canceled');
CREATE TYPE transaction_type AS ENUM ('purchase', 'withdrawal', 'reward', 'content_access', 'refund', 'bonus');
CREATE TYPE payment_method AS ENUM ('paystack', 'flutterwave', 'crypto', 'coins', 'bank_transfer');
CREATE TYPE content_type AS ENUM ('video', 'audio', 'image', 'document', 'live_stream');
CREATE TYPE post_type AS ENUM ('bars', 'story', 'event', 'general', 'announcement', 'poll');
CREATE TYPE album_type AS ENUM ('album', 'ep', 'mixtape', 'single', 'compilation');
CREATE TYPE ticket_status AS ENUM ('confirmed', 'pending', 'canceled', 'used', 'expired');
CREATE TYPE notification_type AS ENUM ('system', 'content', 'social', 'payment', 'event', 'tier_upgrade');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET');
CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'other');
CREATE TYPE report_target_type AS ENUM ('post', 'comment');

-- =====================================================
-- 2. CORE USER SYSTEM
-- =====================================================

-- Users table with comprehensive profile management
CREATE TABLE public.users (
    id bigint primary key generated always as identity,
    auth_user_id uuid unique not null references auth.users(id) on delete cascade,
    username text unique not null check (length(username) >= 3 and length(username) <= 30),
    full_name text not null check (length(full_name) >= 2),
    email text unique not null,
    avatar_url text,
    cover_image_url text,
    tier user_tier default 'grassroot',
    role user_role default 'user',
    level integer default 1 check (level >= 1 and level <= 100),
    points integer default 0 check (points >= 0),
    coins integer default 100 check (coins >= 0),
    erigga_id text unique,
    bio text check (length(bio) <= 500),
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
    referred_by bigint references public.users(id),
    subscription_expires_at timestamp with time zone,
    email_verified boolean default false,
    phone_verified boolean default false,
    two_factor_enabled boolean default false,
    two_factor_secret text,
    reputation_score integer default 0,
    total_posts integer default 0,
    followers_count integer default 0,
    following_count integer default 0,
    preferences jsonb default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- User permissions table
CREATE TABLE public.user_permissions (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    permission text not null,
    granted_by bigint references public.users(id),
    granted_at timestamp with time zone default now(),
    expires_at timestamp with time zone,
    is_active boolean default true,
    unique(user_id, permission)
);

-- User sessions
CREATE TABLE public.user_sessions (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    session_token text unique not null,
    device_info jsonb default '{}',
    ip_address inet,
    user_agent text,
    is_active boolean default true,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default now(),
    last_activity timestamp with time zone default now()
);

-- User settings
CREATE TABLE public.user_settings (
    id bigint primary key generated always as identity,
    user_id bigint unique not null references public.users(id) on delete cascade,
    theme text default 'system' check (theme in ('light', 'dark', 'system')),
    language text default 'en',
    timezone text default 'UTC',
    email_notifications boolean default true,
    push_notifications boolean default true,
    sms_notifications boolean default false,
    marketing_emails boolean default true,
    privacy_level text default 'public' check (privacy_level in ('public', 'friends', 'private')),
    auto_play_videos boolean default true,
    show_online_status boolean default true,
    allow_friend_requests boolean default true,
    content_filter_level text default 'moderate' check (content_filter_level in ('strict', 'moderate', 'off')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- User follows/followers
CREATE TABLE public.user_follows (
    id bigint primary key generated always as identity,
    follower_id bigint not null references public.users(id) on delete cascade,
    following_id bigint not null references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(follower_id, following_id),
    check (follower_id != following_id)
);

-- User blocks
CREATE TABLE public.user_blocks (
    id bigint primary key generated always as identity,
    blocker_id bigint not null references public.users(id) on delete cascade,
    blocked_id bigint not null references public.users(id) on delete cascade,
    reason text,
    created_at timestamp with time zone default now(),
    unique(blocker_id, blocked_id),
    check (blocker_id != blocked_id)
);

-- =====================================================
-- 3. CONTENT MANAGEMENT SYSTEM
-- =====================================================

-- Albums
CREATE TABLE public.albums (
    id bigint primary key generated always as identity,
    title text not null check (length(title) >= 1),
    slug text unique not null,
    description text,
    cover_url text not null,
    cover_blur_hash text,
    type album_type default 'album',
    genre text,
    release_date date not null,
    total_tracks integer default 0 check (total_tracks >= 0),
    duration_seconds integer default 0 check (duration_seconds >= 0),
    is_premium boolean default false,
    required_tier user_tier default 'grassroot',
    coin_price integer default 0 check (coin_price >= 0),
    play_count integer default 0 check (play_count >= 0),
    like_count integer default 0 check (like_count >= 0),
    download_count integer default 0 check (download_count >= 0),
    is_featured boolean default false,
    is_published boolean default true,
    producer text,
    record_label text,
    copyright_info text,
    explicit_content boolean default false,
    tags text[] default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Tracks
CREATE TABLE public.tracks (
    id bigint primary key generated always as identity,
    album_id bigint references public.albums(id) on delete set null,
    title text not null check (length(title) >= 1),
    slug text unique not null,
    artist text not null default 'Erigga',
    featuring text,
    duration_seconds integer not null check (duration_seconds > 0),
    track_number integer check (track_number > 0),
    disc_number integer default 1 check (disc_number > 0),
    lyrics text,
    cover_url text,
    cover_blur_hash text,
    audio_url text,
    audio_preview_url text,
    waveform_data jsonb,
    is_premium boolean default false,
    required_tier user_tier default 'grassroot',
    coin_price integer default 0 check (coin_price >= 0),
    play_count integer default 0 check (play_count >= 0),
    like_count integer default 0 check (like_count >= 0),
    download_count integer default 0 check (download_count >= 0),
    share_count integer default 0 check (share_count >= 0),
    release_date date not null,
    is_single boolean default false,
    is_featured boolean default false,
    is_published boolean default true,
    genre text,
    mood text,
    tempo integer,
    key_signature text,
    producer text,
    songwriter text,
    explicit_content boolean default false,
    isrc text unique,
    tags text[] default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Streaming platform links
CREATE TABLE public.streaming_links (
    id bigint primary key generated always as identity,
    track_id bigint references public.tracks(id) on delete cascade,
    album_id bigint references public.albums(id) on delete cascade,
    platform text not null check (platform in ('spotify', 'apple_music', 'youtube_music', 'audiomack', 'soundcloud', 'deezer', 'tidal', 'amazon_music')),
    url text not null,
    platform_id text,
    is_verified boolean default false,
    created_at timestamp with time zone default now(),
    check ((track_id is not null) or (album_id is not null)),
    unique(track_id, platform),
    unique(album_id, platform)
);

-- Music videos
CREATE TABLE public.music_videos (
    id bigint primary key generated always as identity,
    track_id bigint references public.tracks(id) on delete set null,
    title text not null,
    slug text unique not null,
    description text,
    video_url text not null,
    thumbnail_url text not null,
    thumbnail_blur_hash text,
    duration_seconds integer not null check (duration_seconds > 0),
    views integer default 0 check (views >= 0),
    likes integer default 0 check (likes >= 0),
    dislikes integer default 0 check (dislikes >= 0),
    comments_count integer default 0 check (comments_count >= 0),
    is_premium boolean default false,
    required_tier user_tier default 'grassroot',
    coin_price integer default 0 check (coin_price >= 0),
    release_date date not null,
    is_featured boolean default false,
    is_published boolean default true,
    director text,
    producer text,
    location text,
    explicit_content boolean default false,
    quality text default 'HD' check (quality in ('SD', 'HD', '4K')),
    tags text[] default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Gallery
CREATE TABLE public.gallery_items (
    id bigint primary key generated always as identity,
    title text not null,
    slug text unique not null,
    description text,
    image_url text not null,
    thumbnail_url text,
    blur_hash text,
    category text not null,
    subcategory text,
    is_premium boolean default false,
    required_tier user_tier default 'grassroot',
    coin_price integer default 0 check (coin_price >= 0),
    views integer default 0 check (views >= 0),
    likes integer default 0 check (likes >= 0),
    downloads integer default 0 check (downloads >= 0),
    is_featured boolean default false,
    is_published boolean default true,
    photographer text,
    location text,
    taken_at timestamp with time zone,
    camera_info jsonb default '{}',
    tags text[] default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Media content
CREATE TABLE public.media_content (
    id bigint primary key generated always as identity,
    title text not null,
    slug text unique not null,
    description text,
    type content_type not null,
    file_url text not null,
    thumbnail_url text,
    blur_hash text,
    duration_seconds integer,
    file_size bigint,
    mime_type text,
    is_premium boolean default false,
    required_tier user_tier default 'grassroot',
    coin_price integer default 0 check (coin_price >= 0),
    view_count integer default 0 check (view_count >= 0),
    like_count integer default 0 check (like_count >= 0),
    download_count integer default 0 check (download_count >= 0),
    share_count integer default 0 check (share_count >= 0),
    is_featured boolean default false,
    is_published boolean default true,
    creator text,
    category text,
    subcategory text,
    explicit_content boolean default false,
    quality text,
    tags text[] default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- =====================================================
-- 4. COMMUNITY SYSTEM
-- =====================================================

-- Community categories
CREATE TABLE public.community_categories (
    id bigint primary key generated always as identity,
    name text not null unique,
    slug text not null unique,
    description text,
    icon text,
    color text,
    display_order integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Community posts
CREATE TABLE public.community_posts (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    category_id bigint references public.community_categories(id) on delete set null,
    content text not null check (length(content) >= 1 and length(content) <= 5000),
    type post_type default 'general',
    media_url text,
    media_type text,
    media_metadata jsonb,
    vote_count integer default 0 check (vote_count >= 0),
    comment_count integer default 0 check (comment_count >= 0),
    view_count integer default 0 check (view_count >= 0),
    reaction_count integer default 0 check (reaction_count >= 0),
    share_count integer default 0 check (share_count >= 0),
    is_featured boolean default false,
    is_pinned boolean default false,
    is_published boolean default true,
    is_edited boolean default false,
    is_deleted boolean default false,
    is_trending boolean default false,
    trending_score decimal(10,2) default 0,
    deleted_at timestamp with time zone,
    scheduled_at timestamp with time zone,
    expires_at timestamp with time zone,
    location text,
    mood text,
    tags text[] default '{}',
    mentions bigint[] default '{}',
    hashtags text[] default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Community post votes
CREATE TABLE public.community_post_votes (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.community_posts(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(post_id, user_id)
);

-- Community comments
CREATE TABLE public.community_comments (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.community_posts(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    parent_comment_id bigint references public.community_comments(id) on delete cascade,
    content text not null check (length(content) >= 1 and length(content) <= 1000),
    like_count integer default 0 check (like_count >= 0),
    reply_count integer default 0 check (reply_count >= 0),
    is_edited boolean default false,
    is_deleted boolean default false,
    deleted_at timestamp with time zone,
    mentions bigint[] default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Community comment likes
CREATE TABLE public.community_comment_likes (
    id bigint primary key generated always as identity,
    comment_id bigint not null references public.community_comments(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(comment_id, user_id)
);

-- Post reactions
CREATE TABLE public.post_reactions (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.community_posts(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    reaction_type text not null check (reaction_type in ('fire', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at timestamp with time zone default now(),
    unique(post_id, user_id, reaction_type)
);

-- Post bookmarks
CREATE TABLE public.post_bookmarks (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.community_posts(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(post_id, user_id)
);

-- Hashtags
CREATE TABLE public.hashtags (
    id bigint primary key generated always as identity,
    name text not null unique,
    slug text not null unique,
    usage_count integer default 0,
    is_trending boolean default false,
    created_at timestamp with time zone default now()
);

-- Post hashtags
CREATE TABLE public.post_hashtags (
    post_id bigint not null references public.community_posts(id) on delete cascade,
    hashtag_id bigint not null references public.hashtags(id) on delete cascade,
    primary key (post_id, hashtag_id)
);

-- Post mentions
CREATE TABLE public.post_mentions (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.community_posts(id) on delete cascade,
    mentioned_user_id bigint not null references public.users(id) on delete cascade,
    mentioned_by_user_id bigint not null references public.users(id) on delete cascade,
    position integer,
    created_at timestamp with time zone default now()
);

-- Reports
CREATE TABLE public.reports (
    id bigint primary key generated always as identity,
    reporter_id bigint not null references public.users(id) on delete cascade,
    reported_user_id bigint references public.users(id) on delete cascade,
    post_id bigint references public.community_posts(id) on delete cascade,
    comment_id bigint references public.community_comments(id) on delete cascade,
    reason report_reason not null,
    description text,
    status text default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by bigint references public.users(id),
    reviewed_at timestamp with time zone,
    resolution text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    check ((reported_user_id is not null) or (post_id is not null) or (comment_id is not null))
);

-- =====================================================
-- 5. COMMERCE SYSTEM
-- =====================================================

-- Coin transactions
CREATE TABLE public.coin_transactions (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    amount integer not null,
    transaction_type transaction_type not null,
    payment_method payment_method,
    reference_id text unique,
    external_reference text,
    status payment_status not null default 'pending',
    description text,
    metadata jsonb default '{}',
    fee_amount integer default 0,
    net_amount integer,
    currency text default 'NGN',
    exchange_rate decimal(10,4) default 1.0000,
    processed_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason text,
    refunded_at timestamp with time zone,
    refund_reason text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Content access
CREATE TABLE public.content_access (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    content_type text not null,
    content_id bigint not null,
    access_type text not null default 'purchase' check (access_type in ('purchase', 'subscription', 'free', 'promotional')),
    coins_spent integer default 0 check (coins_spent >= 0),
    expires_at timestamp with time zone,
    access_count integer default 0 check (access_count >= 0),
    last_accessed timestamp with time zone,
    is_active boolean default true,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    unique(user_id, content_type, content_id)
);

-- Products
CREATE TABLE public.products (
    id bigint primary key generated always as identity,
    name text not null,
    slug text unique not null,
    description text,
    short_description text,
    price decimal(10,2) not null check (price >= 0),
    compare_at_price decimal(10,2) check (compare_at_price >= price),
    cost_price decimal(10,2) check (cost_price >= 0),
    images text[] default '{}',
    thumbnail_url text,
    sizes text[] default '{}',
    colors text[] default '{}',
    category text,
    subcategory text,
    brand text default 'Erigga Official',
    sku text unique,
    barcode text,
    is_premium_only boolean default false,
    required_tier user_tier default 'grassroot',
    coin_price integer default 0 check (coin_price >= 0),
    stock_quantity integer default 0 check (stock_quantity >= 0),
    low_stock_threshold integer default 10,
    weight decimal(8,2),
    dimensions jsonb default '{}',
    is_active boolean default true,
    is_featured boolean default false,
    is_digital boolean default false,
    requires_shipping boolean default true,
    tax_rate decimal(5,4) default 0.0000,
    tags text[] default '{}',
    seo_title text,
    seo_description text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Product variants
CREATE TABLE public.product_variants (
    id bigint primary key generated always as identity,
    product_id bigint not null references public.products(id) on delete cascade,
    name text not null,
    sku text unique,
    price decimal(10,2) not null check (price >= 0),
    compare_at_price decimal(10,2),
    cost_price decimal(10,2),
    stock_quantity integer default 0 check (stock_quantity >= 0),
    weight decimal(8,2),
    size text,
    color text,
    material text,
    image_url text,
    is_active boolean default true,
    position integer default 0,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Orders
CREATE TABLE public.orders (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    order_number text unique not null,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded')),
    payment_status payment_status default 'pending',
    payment_method payment_method,
    payment_reference text,
    subtotal decimal(10,2) not null check (subtotal >= 0),
    tax_amount decimal(10,2) default 0 check (tax_amount >= 0),
    shipping_amount decimal(10,2) default 0 check (shipping_amount >= 0),
    discount_amount decimal(10,2) default 0 check (discount_amount >= 0),
    total_amount decimal(10,2) not null check (total_amount >= 0),
    currency text default 'NGN',
    coins_used integer default 0 check (coins_used >= 0),
    shipping_address jsonb not null,
    billing_address jsonb,
    notes text,
    tracking_number text,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    canceled_at timestamp with time zone,
    cancellation_reason text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Order items
CREATE TABLE public.order_items (
    id bigint primary key generated always as identity,
    order_id bigint not null references public.orders(id) on delete cascade,
    product_id bigint not null references public.products(id),
    variant_id bigint references public.product_variants(id),
    quantity integer not null check (quantity > 0),
    unit_price decimal(10,2) not null check (unit_price >= 0),
    total_price decimal(10,2) not null check (total_price >= 0),
    product_snapshot jsonb not null,
    created_at timestamp with time zone default now()
);

-- =====================================================
-- 6. EVENTS SYSTEM
-- =====================================================

-- Events
CREATE TABLE public.events (
    id bigint primary key generated always as identity,
    title text not null,
    slug text unique not null,
    description text,
    short_description text,
    venue text not null,
    address text not null,
    city text not null,
    state text not null,
    country text default 'Nigeria',
    coordinates point,
    date timestamp with time zone not null,
    end_date timestamp with time zone,
    doors_open timestamp with time zone,
    ticket_price decimal(10,2) not null check (ticket_price >= 0),
    vip_price decimal(10,2) check (vip_price >= ticket_price),
    max_tickets integer not null check (max_tickets > 0),
    max_vip_tickets integer default 0 check (max_vip_tickets >= 0),
    tickets_sold integer default 0 check (tickets_sold >= 0),
    vip_tickets_sold integer default 0 check (vip_tickets_sold >= 0),
    image_url text,
    banner_url text,
    gallery_urls text[] default '{}',
    is_active boolean default true,
    is_featured boolean default false,
    is_sold_out boolean default false,
    is_canceled boolean default false,
    canceled_reason text,
    age_restriction integer check (age_restriction >= 0),
    dress_code text,
    special_instructions text,
    organizer text default 'Erigga Official',
    contact_email text,
    contact_phone text,
    social_links jsonb default '{}',
    tags text[] default '{}',
    category text,
    genre text,
    seo_title text,
    seo_description text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Tickets
CREATE TABLE public.tickets (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    event_id bigint not null references public.events(id) on delete cascade,
    ticket_number text unique not null,
    ticket_type text default 'regular' check (ticket_type in ('regular', 'vip', 'backstage', 'meet_greet')),
    qr_code text unique not null,
    qr_code_url text,
    status ticket_status default 'pending',
    payment_reference text not null,
    amount_paid decimal(10,2) not null check (amount_paid >= 0),
    fees_paid decimal(10,2) default 0 check (fees_paid >= 0),
    total_paid decimal(10,2) not null check (total_paid >= 0),
    currency text default 'NGN',
    payment_method payment_method,
    buyer_name text not null,
    buyer_email text not null,
    buyer_phone text,
    seat_number text,
    section text,
    row_number text,
    special_access text[] default '{}',
    purchased_at timestamp with time zone default now(),
    used_at timestamp with time zone,
    validated_by bigint references public.users(id),
    validation_location text,
    transfer_count integer default 0 check (transfer_count >= 0),
    max_transfers integer default 3 check (max_transfers >= 0),
    is_transferable boolean default true,
    notes text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- =====================================================
-- 7. NOTIFICATIONS SYSTEM
-- =====================================================

-- Notifications
CREATE TABLE public.notifications (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
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

-- =====================================================
-- 8. AUDIT SYSTEM
-- =====================================================

-- Audit logs
CREATE TABLE public.audit_logs (
    id bigint primary key generated always as identity,
    user_id bigint references public.users(id),
    action audit_action not null,
    table_name text,
    record_id bigint,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now()
);

-- =====================================================
-- 9. FREEBIES SYSTEM
-- =====================================================

-- Freebies
CREATE TABLE public.freebies (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    title text not null,
    description text,
    type text not null default 'other',
    file_url text not null,
    thumbnail_url text,
    vote_count integer default 0,
    download_count integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Freebie votes
CREATE TABLE public.freebie_votes (
    freebie_id bigint not null references public.freebies(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    primary key (freebie_id, user_id)
);

-- =====================================================
-- 10. PERFORMANCE INDEXES
-- =====================================================

-- User indexes
CREATE INDEX idx_users_auth_user_id ON public.users (auth_user_id);
CREATE INDEX idx_users_username ON public.users (username);
CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_tier ON public.users (tier);
CREATE INDEX idx_users_role ON public.users (role);
CREATE INDEX idx_users_is_active ON public.users (is_active);
CREATE INDEX idx_users_created_at ON public.users (created_at DESC);
CREATE INDEX idx_users_referral_code ON public.users (referral_code);

-- Content indexes
CREATE INDEX idx_albums_release_date ON public.albums (release_date DESC);
CREATE INDEX idx_albums_type ON public.albums (type);
CREATE INDEX idx_albums_is_published ON public.albums (is_published);
CREATE INDEX idx_albums_slug ON public.albums (slug);
CREATE INDEX idx_albums_tier ON public.albums (required_tier);

CREATE INDEX idx_tracks_album_id ON public.tracks (album_id);
CREATE INDEX idx_tracks_release_date ON public.tracks (release_date DESC);
CREATE INDEX idx_tracks_is_published ON public.tracks (is_published);
CREATE INDEX idx_tracks_slug ON public.tracks (slug);
CREATE INDEX idx_tracks_tier ON public.tracks (required_tier);
CREATE INDEX idx_tracks_play_count ON public.tracks (play_count DESC);

CREATE INDEX idx_streaming_links_track_id ON public.streaming_links (track_id);
CREATE INDEX idx_streaming_links_album_id ON public.streaming_links (album_id);
CREATE INDEX idx_streaming_links_platform ON public.streaming_links (platform);

CREATE INDEX idx_music_videos_track_id ON public.music_videos (track_id);
CREATE INDEX idx_music_videos_release_date ON public.music_videos (release_date DESC);
CREATE INDEX idx_music_videos_views ON public.music_videos (views DESC);

CREATE INDEX idx_gallery_items_category ON public.gallery_items (category);
CREATE INDEX idx_gallery_items_is_published ON public.gallery_items (is_published);

-- Community indexes
CREATE INDEX idx_community_posts_user_id ON public.community_posts (user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts (created_at DESC);
CREATE INDEX idx_community_posts_type ON public.community_posts (type);
CREATE INDEX idx_community_posts_is_published ON public.community_posts (is_published);
CREATE INDEX idx_community_posts_is_featured ON public.community_posts (is_featured);
CREATE INDEX idx_community_posts_vote_count ON public.community_posts (vote_count DESC);

CREATE INDEX idx_community_comments_post_id ON public.community_comments (post_id);
CREATE INDEX idx_community_comments_user_id ON public.community_comments (user_id);
CREATE INDEX idx_community_comments_parent_id ON public.community_comments (parent_comment_id);
CREATE INDEX idx_community_comments_created_at ON public.community_comments (created_at DESC);

CREATE INDEX idx_community_post_votes_post_id ON public.community_post_votes (post_id);
CREATE INDEX idx_community_post_votes_user_id ON public.community_post_votes (user_id);

CREATE INDEX idx_user_follows_follower ON public.user_follows (follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows (following_id);

-- Transaction indexes
CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions (user_id);
CREATE INDEX idx_coin_transactions_status ON public.coin_transactions (status);
CREATE INDEX idx_coin_transactions_type ON public.coin_transactions (transaction_type);
CREATE INDEX idx_coin_transactions_created_at ON public.coin_transactions (created_at DESC);
CREATE INDEX idx_coin_transactions_reference ON public.coin_transactions (reference_id);

CREATE INDEX idx_content_access_user_id ON public.content_access (user_id);
CREATE INDEX idx_content_access_content ON public.content_access (content_type, content_id);
CREATE INDEX idx_content_access_expires_at ON public.content_access (expires_at);

-- Event indexes
CREATE INDEX idx_events_date ON public.events (date);
CREATE INDEX idx_events_city ON public.events (city);
CREATE INDEX idx_events_is_active ON public.events (is_active);
CREATE INDEX idx_events_slug ON public.events (slug);

CREATE INDEX idx_tickets_user_id ON public.tickets (user_id);
CREATE INDEX idx_tickets_event_id ON public.tickets (event_id);
CREATE INDEX idx_tickets_status ON public.tickets (status);
CREATE INDEX idx_tickets_qr_code ON public.tickets (qr_code);

-- Product indexes
CREATE INDEX idx_products_category ON public.products (category);
CREATE INDEX idx_products_is_active ON public.products (is_active);
CREATE INDEX idx_products_slug ON public.products (slug);
CREATE INDEX idx_products_created_at ON public.products (created_at DESC);

CREATE INDEX idx_orders_user_id ON public.orders (user_id);
CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications (is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications (created_at DESC);

-- Hashtag indexes
CREATE INDEX idx_hashtags_trending ON public.hashtags (is_trending, usage_count DESC);
CREATE INDEX idx_hashtags_name_trgm ON public.hashtags USING gin(name gin_trgm_ops);

-- Full-text search indexes
CREATE INDEX idx_albums_search ON public.albums USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));
CREATE INDEX idx_tracks_search ON public.tracks USING gin(to_tsvector('english', title || ' ' || artist || ' ' || coalesce(featuring, '') || ' ' || coalesce(lyrics, '')));
CREATE INDEX idx_community_posts_search ON public.community_posts USING gin(to_tsvector('english', content));
CREATE INDEX idx_events_search ON public.events USING gin(to_tsvector('english', title || ' ' || coalesce(description, '') || ' ' || venue));
CREATE INDEX idx_products_search ON public.products USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- =====================================================
-- 11. FUNCTIONS AND TRIGGERS
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
    NEW.referral_code := upper(substring(md5(random()::text) from 1 for 8));
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

-- Function to handle post interactions
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'community_comments' THEN
            UPDATE public.community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_TABLE_NAME = 'community_post_votes' THEN
            UPDATE public.community_posts SET vote_count = vote_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'community_comments' THEN
            UPDATE public.community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
        ELSIF TG_TABLE_NAME = 'community_post_votes' THEN
            UPDATE public.community_posts SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to handle comment interactions
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'community_comments' AND NEW.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
        ELSIF TG_TABLE_NAME = 'community_comment_likes' THEN
            UPDATE public.community_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'community_comments' AND OLD.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
        ELSIF TG_TABLE_NAME = 'community_comment_likes' THEN
            UPDATE public.community_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        auth_user_id,
        email,
        username,
        full_name,
        tier,
        coins,
        level,
        points,
        is_active,
        is_verified,
        is_banned
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'grassroot',
        100,
        1,
        0,
        true,
        false,
        false
    );
    
    -- Create user settings
    INSERT INTO public.user_settings (user_id)
    VALUES ((SELECT id FROM public.users WHERE auth_user_id = NEW.id));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle post voting with coins
CREATE OR REPLACE FUNCTION handle_post_vote(
    p_post_id bigint,
    p_voter_id bigint,
    p_coin_amount integer DEFAULT 1
)
RETURNS boolean AS $$
DECLARE
    voter_coins integer;
    post_creator_id bigint;
BEGIN
    -- Get voter's current coins
    SELECT coins INTO voter_coins FROM public.users WHERE id = p_voter_id;
    
    -- Check if voter has enough coins
    IF voter_coins IS NULL OR voter_coins < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;
    
    -- Check if user already voted
    IF EXISTS (SELECT 1 FROM public.community_post_votes WHERE post_id = p_post_id AND user_id = p_voter_id) THEN
        RAISE EXCEPTION 'User has already voted on this post';
    END IF;
    
    -- Get post creator
    SELECT user_id INTO post_creator_id FROM public.community_posts WHERE id = p_post_id;
    
    -- Deduct coins from voter
    UPDATE public.users SET coins = coins - p_coin_amount WHERE id = p_voter_id;
    
    -- Add coins to post creator
    UPDATE public.users SET coins = coins + p_coin_amount WHERE id = post_creator_id;
    
    -- Record the vote
    INSERT INTO public.community_post_votes (post_id, user_id) VALUES (p_post_id, p_voter_id);
    
    -- Update post vote count (handled by trigger)
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_post_vote: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER generate_erigga_id_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION generate_erigga_id();

CREATE TRIGGER generate_referral_code_trigger
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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

-- Post interaction triggers
CREATE TRIGGER update_post_comment_count AFTER INSERT OR DELETE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE TRIGGER update_post_vote_count AFTER INSERT OR DELETE ON public.community_post_votes FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Comment interaction triggers
CREATE TRIGGER update_comment_reply_count AFTER INSERT OR DELETE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION update_comment_counts();
CREATE TRIGGER update_comment_like_count AFTER INSERT OR DELETE ON public.community_comment_likes FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaming_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebie_votes ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Public profiles are viewable" ON public.users
    FOR SELECT USING (is_active = true AND is_banned = false);

-- User settings policies
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Content policies (public read)
CREATE POLICY "Albums are viewable by everyone" ON public.albums
    FOR SELECT USING (is_published = true);

CREATE POLICY "Tracks are viewable by everyone" ON public.tracks
    FOR SELECT USING (is_published = true);

CREATE POLICY "Streaming links are viewable by everyone" ON public.streaming_links
    FOR SELECT USING (true);

CREATE POLICY "Music videos are viewable by everyone" ON public.music_videos
    FOR SELECT USING (is_published = true);

CREATE POLICY "Gallery items are viewable by everyone" ON public.gallery_items
    FOR SELECT USING (is_published = true);

CREATE POLICY "Media content is viewable by everyone" ON public.media_content
    FOR SELECT USING (is_published = true);

CREATE POLICY "Events are viewable by everyone" ON public.events
    FOR SELECT USING (is_active = true);

CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Product variants are viewable by everyone" ON public.product_variants
    FOR SELECT USING (is_active = true);

-- Community policies
CREATE POLICY "Categories are viewable by everyone" ON public.community_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Posts are viewable by everyone" ON public.community_posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

CREATE POLICY "Users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete their own posts" ON public.community_posts
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Comments are viewable by everyone" ON public.community_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own comments" ON public.community_comments
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete their own comments" ON public.community_comments
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Vote policies
CREATE POLICY "Votes are viewable by everyone" ON public.community_post_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own votes" ON public.community_post_votes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Comment likes are viewable by everyone" ON public.community_comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own comment likes" ON public.community_comment_likes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Follow policies
CREATE POLICY "Follows are viewable by everyone" ON public.user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON public.user_follows
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = follower_id));

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

-- Notification policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Freebies policies
CREATE POLICY "Freebies are viewable by everyone" ON public.freebies
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create freebies" ON public.freebies
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own freebies" ON public.freebies
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Freebie votes are viewable by everyone" ON public.freebie_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own freebie votes" ON public.freebie_votes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Admin policies
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
-- 13. STORAGE BUCKETS AND POLICIES
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
('community-media', 'community-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav']),
('content-media', 'content-media', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav']),
('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars" ON storage.objects 
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update their own avatars" ON storage.objects 
FOR UPDATE USING (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects 
FOR DELETE USING (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for community media
CREATE POLICY "Authenticated users can upload community media" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'community-media' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view community media" ON storage.objects
FOR SELECT USING (bucket_id = 'community-media');

CREATE POLICY "Users can update their own community media" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'community-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own community media" ON storage.objects
FOR DELETE USING (
    bucket_id = 'community-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for content media (admin only)
CREATE POLICY "Admins can upload content media" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'content-media' 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Anyone can view content media" ON storage.objects
FOR SELECT USING (bucket_id = 'content-media');

CREATE POLICY "Admins can manage content media" ON storage.objects
FOR ALL USING (
    bucket_id = 'content-media' 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Storage policies for product images (admin only)
CREATE POLICY "Admins can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'product-images' 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can manage product images" ON storage.objects
FOR ALL USING (
    bucket_id = 'product-images' 
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- =====================================================
-- 14. SEED DATA
-- =====================================================

-- Insert community categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'Open discussion for all topics', '💬', '#3B82F6', 1),
('Music & Bars', 'music-bars', 'Share your bars and discuss music', '🎵', '#10B981', 2),
('Events & Shows', 'events', 'Upcoming events and show discussions', '🎤', '#F59E0B', 3),
('Fan Art & Media', 'fan-art', 'Share your creative works', '🎨', '#8B5CF6', 4),
('Questions & Help', 'questions', 'Ask questions and get help', '❓', '#EF4444', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample albums
INSERT INTO public.albums (title, slug, description, cover_url, type, genre, release_date, total_tracks, duration_seconds, is_premium, required_tier, coin_price, play_count, producer, record_label, tags) VALUES
('The Erigma', 'the-erigma', 'The breakthrough album that established Erigga as the Paper Boi of South-South Nigeria', '/placeholder.svg?height=400&width=400&text=The+Erigma', 'album', 'Afro Hip-Hop', '2019-02-14', 17, 3765, false, 'grassroot', 0, 2500000, 'Kel-P, Popito', 'Emirate Empire', ARRAY['hip-hop', 'afrobeats', 'street']),
('The Erigma II', 'the-erigma-ii', 'The highly anticipated sequel featuring collaborations with top Nigerian artists', '/placeholder.svg?height=400&width=400&text=The+Erigma+II', 'album', 'Afro Hip-Hop', '2020-10-30', 15, 3512, false, 'grassroot', 0, 3200000, 'Kel-P, Popito, Vstix', 'Emirate Empire', ARRAY['hip-hop', 'afrobeats', 'collaboration']),
('Street Motivation', 'street-motivation', 'Raw street stories and motivational tracks for the hustlers', '/placeholder.svg?height=400&width=400&text=Street+Motivation', 'mixtape', 'Street Hip-Hop', '2021-06-15', 12, 2718, true, 'pioneer', 75, 1800000, 'Kel-P, Popito', 'Emirate Empire', ARRAY['street', 'motivation', 'hustle']),
('Blood & Sweat', 'blood-and-sweat', 'Premium exclusive album showcasing Erigga''s versatility and growth', '/placeholder.svg?height=400&width=400&text=Blood+Sweat', 'album', 'Afro Hip-Hop', '2023-12-01', 20, 4530, true, 'blood', 200, 500000, 'Kel-P, Vstix, Popito', 'Emirate Empire', ARRAY['premium', 'exclusive', 'growth']),
('Paper Boi Chronicles', 'paper-boi-chronicles', 'The definitive collection of Erigga''s greatest hits and unreleased tracks', '/placeholder.svg?height=400&width=400&text=Paper+Boi+Chronicles', 'compilation', 'Afro Hip-Hop', '2024-01-15', 25, 5625, true, 'elder', 150, 750000, 'Various', 'Emirate Empire', ARRAY['greatest-hits', 'compilation', 'unreleased']);

-- Insert sample tracks
INSERT INTO public.tracks (album_id, title, slug, artist, featuring, duration_seconds, track_number, lyrics, cover_url, release_date, play_count, is_premium, required_tier, coin_price, genre, producer, songwriter, tags) VALUES
(1, 'Send Her Money', 'send-her-money', 'Erigga', 'Yemi Alade', 225, 1, 'Send her money, send her money...', '/placeholder.svg?height=400&width=400&text=Send+Her+Money', '2019-02-14', 5200000, false, 'grassroot', 0, 'Afrobeats', 'Kel-P', 'Erigga', ARRAY['love', 'money', 'relationship']),
(1, 'Motivation', 'motivation', 'Erigga', 'Victor AD', 198, 2, 'Every day I wake up with motivation...', '/placeholder.svg?height=400&width=400&text=Motivation', '2019-02-14', 3800000, false, 'grassroot', 0, 'Hip-Hop', 'Popito', 'Erigga', ARRAY['motivation', 'hustle', 'success']),
(2, 'The Erigma II', 'the-erigma-ii-title', 'Erigga', NULL, 210, 1, 'Welcome to the Erigma II...', '/placeholder.svg?height=400&width=400&text=Erigma+II', '2020-10-30', 2100000, false, 'grassroot', 0, 'Hip-Hop', 'Kel-P', 'Erigga', ARRAY['intro', 'erigma', 'sequel']),
(3, 'Street Credibility', 'street-credibility', 'Erigga', 'Zlatan', 187, 1, 'Street credibility na wetin I get...', '/placeholder.svg?height=400&width=400&text=Street+Credibility', '2021-06-15', 1500000, true, 'pioneer', 25, 'Street Hip-Hop', 'Popito', 'Erigga', ARRAY['street', 'credibility', 'respect']),
(4, 'Blood Money', 'blood-money', 'Erigga', 'Phyno', 245, 1, 'Blood money no dey pay...', '/placeholder.svg?height=400&width=400&text=Blood+Money', '2023-12-01', 800000, true, 'blood', 50, 'Afro Hip-Hop', 'Vstix', 'Erigga', ARRAY['premium', 'philosophy', 'money']);

-- Insert sample events
INSERT INTO public.events (title, slug, description, venue, address, city, state, date, ticket_price, vip_price, max_tickets, max_vip_tickets, image_url, organizer, contact_email, tags) VALUES
('Erigga Live in Concert - Lagos', 'erigga-live-lagos-2024', 'The biggest Erigga concert of the year featuring special guests and surprise performances', 'Eko Hotel Convention Centre', 'Plot 1415, Adetokunbo Ademola Street, Victoria Island', 'Lagos', 'Lagos', '2024-12-15 20:00:00+01', 15000.00, 50000.00, 5000, 500, '/placeholder.svg?height=400&width=600&text=Erigga+Live+Lagos', 'Emirate Empire', 'events@emirateempire.com', ARRAY['concert', 'live-music', 'lagos']),
('Paper Boi Chronicles Album Launch', 'paper-boi-chronicles-launch', 'Exclusive album launch party with live performances and meet & greet', 'Terra Kulture Arena', '1376 Tiamiyu Savage Street, Victoria Island', 'Lagos', 'Lagos', '2024-02-14 19:00:00+01', 25000.00, 75000.00, 1000, 100, '/placeholder.svg?height=400&width=600&text=Album+Launch', 'Emirate Empire', 'events@emirateempire.com', ARRAY['album-launch', 'exclusive', 'meet-greet']);

-- Insert sample products
INSERT INTO public.products (name, slug, description, price, images, category, brand, sku, stock_quantity, is_featured, coin_price, tags) VALUES
('Paper Boi Official T-Shirt', 'paper-boi-tshirt', 'Premium quality cotton t-shirt with Paper Boi logo', 8500.00, ARRAY['/placeholder.svg?height=400&width=400&text=Paper+Boi+Tshirt'], 'Clothing', 'Erigga Official', 'PB-TSHIRT-001', 500, true, 85, ARRAY['clothing', 'tshirt', 'paper-boi']),
('Erigma Hoodie', 'erigma-hoodie', 'Comfortable hoodie featuring The Erigma album artwork', 15000.00, ARRAY['/placeholder.svg?height=400&width=400&text=Erigma+Hoodie'], 'Clothing', 'Erigga Official', 'EG-HOODIE-001', 200, true, 150, ARRAY['clothing', 'hoodie', 'erigma']),
('Emirate Empire Cap', 'emirate-empire-cap', 'Snapback cap with embroidered Emirate Empire logo', 6500.00, ARRAY['/placeholder.svg?height=400&width=400&text=Emirate+Cap'], 'Accessories', 'Erigga Official', 'EE-CAP-001', 300, false, 65, ARRAY['accessories', 'cap', 'emirate']);

-- Insert sample gallery items
INSERT INTO public.gallery_items (title, slug, description, image_url, category, subcategory, views, likes, photographer, location, taken_at, tags) VALUES
('Erigga Live in Lagos', 'erigga-live-lagos', 'Erigga performing at the Eko Hotel Lagos', '/placeholder.svg?height=600&width=800&text=Erigga+Live+Lagos', 'Performance', 'Concert', 15000, 2500, 'Kelechi Amadi-Obi', 'Eko Hotel, Lagos', '2023-12-15 20:30:00+01', ARRAY['concert', 'lagos', 'performance']),
('Studio Session', 'studio-session-2024', 'Behind the scenes in the studio working on new music', '/placeholder.svg?height=600&width=800&text=Studio+Session', 'Behind The Scenes', 'Studio', 8500, 1200, 'Emmanuel Oyeleke', 'Emirate Studios, Warri', '2024-01-10 14:00:00+01', ARRAY['studio', 'recording', 'behind-scenes']),
('Paper Boi Portrait', 'paper-boi-portrait', 'Professional portrait shoot for Paper Boi Chronicles album', '/placeholder.svg?height=800&width=600&text=Paper+Boi+Portrait', 'Portrait', 'Professional', 12000, 1800, 'Ty Bello', 'Lagos, Nigeria', '2023-11-20 10:00:00+01', ARRAY['portrait', 'professional', 'album-cover']);

-- Insert hashtags
INSERT INTO public.hashtags (name, slug, usage_count, is_trending) VALUES
('PaperBoi', 'paperboi', 1250, true),
('EriggaLive', 'eriggalive', 890, true),
('WarriToTheWorld', 'warritotheworld', 675, true),
('StreetMotivation', 'streetmotivation', 445, false),
('EmiratEmpire', 'emirateempire', 320, false);

-- =====================================================
-- 15. FINAL SETUP AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Enable realtime for community features
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comment_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create admin user function (for initial setup)
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_email text,
    admin_password text,
    admin_username text,
    admin_full_name text
)
RETURNS text AS $$
DECLARE
    new_user_id uuid;
    admin_user_id bigint;
BEGIN
    -- This function should be called after creating the auth user manually
    -- Get the auth user ID
    SELECT id INTO new_user_id FROM auth.users WHERE email = admin_email;
    
    IF new_user_id IS NULL THEN
        RETURN 'Auth user not found. Please create the auth user first.';
    END IF;
    
    -- Update the user profile to admin
    UPDATE public.users 
    SET 
        role = 'super_admin',
        tier = 'blood',
        coins = 10000,
        is_verified = true,
        username = admin_username,
        full_name = admin_full_name
    WHERE auth_user_id = new_user_id
    RETURNING id INTO admin_user_id;
    
    IF admin_user_id IS NULL THEN
        RETURN 'User profile not found or not updated.';
    END IF;
    
    RETURN 'Admin user created successfully with ID: ' || admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Log completion
INSERT INTO public.audit_logs (action, table_name, metadata) VALUES 
('INSERT', 'system', jsonb_build_object('event', 'database_setup_complete', 'timestamp', now()));

COMMIT;

-- Success message
SELECT 'ERIGGA LIVE DATABASE SETUP COMPLETED SUCCESSFULLY!' as status,
       'All tables, functions, triggers, and policies have been created.' as message,
       'You can now start using your application.' as next_step;
