-- Users table with comprehensive profile management
CREATE TABLE IF NOT EXISTS public.users (
    id bigint primary key generated always as identity,
    auth_user_id uuid unique not null references auth.users(id) on delete cascade,
    username text unique not null check (length(username) >= 3 and length(username) <= 30),
    full_name text,
    email text unique not null,
    avatar_url text,
    cover_image_url text,
    tier user_tier default 'grassroot',
    role user_role default 'user',
    level integer default 1 check (level >= 1 and level <= 100),
    points integer default 0 check (points >= 0),
    coins integer default 0 check (coins >= 0),
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
    email_verified boolean default true,
    phone_verified boolean default false,
    two_factor_enabled boolean default false,
    two_factor_secret text,
    preferences jsonb default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- User permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    permission text not null,
    granted_by bigint references public.users(id),
    granted_at timestamp with time zone default now(),
    expires_at timestamp with time zone,
    is_active boolean default true,
    unique(user_id, permission)
);

-- User sessions for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
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

-- Audit log for security and compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
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

-- Notifications system
CREATE TABLE IF NOT EXISTS public.notifications (
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

-- User preferences and settings
CREATE TABLE IF NOT EXISTS public.user_settings (
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
