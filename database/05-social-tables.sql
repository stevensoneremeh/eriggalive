-- Enhanced posts with rich content support
CREATE TABLE IF NOT EXISTS public.posts (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    content text not null check (length(content) >= 1 and length(content) <= 5000),
    type post_type default 'general',
    media_urls text[] default '{}',
    media_types text[] default '{}',
    thumbnail_urls text[] default '{}',
    like_count integer default 0 check (like_count >= 0),
    comment_count integer default 0 check (comment_count >= 0),
    share_count integer default 0 check (share_count >= 0),
    view_count integer default 0 check (view_count >= 0),
    is_featured boolean default false,
    is_pinned boolean default false,
    is_published boolean default true,
    is_deleted boolean default false,
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

-- Comments with threading support
CREATE TABLE IF NOT EXISTS public.comments (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.posts(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    parent_id bigint references public.comments(id) on delete cascade,
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

-- Post likes with reaction types
CREATE TABLE IF NOT EXISTS public.post_likes (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.posts(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    reaction_type text default 'like' check (reaction_type in ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at timestamp with time zone default now(),
    unique(post_id, user_id)
);

-- Comment likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id bigint primary key generated always as identity,
    comment_id bigint not null references public.comments(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    reaction_type text default 'like' check (reaction_type in ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at timestamp with time zone default now(),
    unique(comment_id, user_id)
);

-- User follows/followers
CREATE TABLE IF NOT EXISTS public.user_follows (
    id bigint primary key generated always as identity,
    follower_id bigint not null references public.users(id) on delete cascade,
    following_id bigint not null references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(follower_id, following_id),
    check (follower_id != following_id)
);

-- User blocks
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id bigint primary key generated always as identity,
    blocker_id bigint not null references public.users(id) on delete cascade,
    blocked_id bigint not null references public.users(id) on delete cascade,
    reason text,
    created_at timestamp with time zone default now(),
    unique(blocker_id, blocked_id),
    check (blocker_id != blocked_id)
);

-- Reports for content moderation
CREATE TABLE IF NOT EXISTS public.reports (
    id bigint primary key generated always as identity,
    reporter_id bigint not null references public.users(id) on delete cascade,
    reported_user_id bigint references public.users(id) on delete cascade,
    post_id bigint references public.posts(id) on delete cascade,
    comment_id bigint references public.comments(id) on delete cascade,
    reason text not null check (reason in ('spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'copyright', 'other')),
    description text,
    status text default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by bigint references public.users(id),
    reviewed_at timestamp with time zone,
    resolution text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    check ((reported_user_id is not null) or (post_id is not null) or (comment_id is not null))
);
