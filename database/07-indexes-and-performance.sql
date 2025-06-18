-- Performance indexes for optimal query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_auth_user_id ON public.users (auth_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON public.users (username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tier ON public.users (tier);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active ON public.users (is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON public.users (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_referral_code ON public.users (referral_code);

-- Content indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_albums_release_date ON public.albums (release_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_albums_type ON public.albums (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_albums_is_published ON public.albums (is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_albums_slug ON public.albums (slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_albums_tier ON public.albums (required_tier);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_album_id ON public.tracks (album_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_release_date ON public.tracks (release_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_is_published ON public.tracks (is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_slug ON public.tracks (slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_tier ON public.tracks (required_tier);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_play_count ON public.tracks (play_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaming_links_track_id ON public.streaming_links (track_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaming_links_album_id ON public.streaming_links (album_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaming_links_platform ON public.streaming_links (platform);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_music_videos_track_id ON public.music_videos (track_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_music_videos_release_date ON public.music_videos (release_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_music_videos_views ON public.music_videos (views DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gallery_items_category ON public.gallery_items (category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gallery_items_is_published ON public.gallery_items (is_published);

-- Transaction indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_status ON public.coin_transactions (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_type ON public.coin_transactions (transaction_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_created_at ON public.coin_transactions (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_reference ON public.coin_transactions (reference_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_access_user_id ON public.content_access (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_access_content ON public.content_access (content_type, content_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_access_expires_at ON public.content_access (expires_at);

-- Social indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_id ON public.posts (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_type ON public.posts (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_is_published ON public.posts (is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_is_featured ON public.posts (is_featured);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id ON public.comments (post_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_user_id ON public.comments (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_parent_id ON public.comments (parent_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at ON public.comments (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_likes_post_id ON public.post_likes (post_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_likes_user_id ON public.post_likes (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_follower ON public.user_follows (follower_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_following ON public.user_follows (following_id);

-- Event indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date ON public.events (date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_city ON public.events (city);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_is_active ON public.events (is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_slug ON public.events (slug);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_event_id ON public.tickets (event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_qr_code ON public.tickets (qr_code);

-- Product indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_active ON public.products (is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- Notification indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON public.notifications (is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- Audit log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_albums_search ON public.albums USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_search ON public.tracks USING gin(to_tsvector('english', title || ' ' || artist || ' ' || coalesce(featuring, '') || ' ' || coalesce(lyrics, '')));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_search ON public.posts USING gin(to_tsvector('english', content));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_search ON public.events USING gin(to_tsvector('english', title || ' ' || coalesce(description, '') || ' ' || venue));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search ON public.products USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
