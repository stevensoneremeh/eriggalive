-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaming_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Public profiles are viewable" ON public.users
    FOR SELECT USING (is_active = true AND is_banned = false);

-- User permissions policies
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- User settings policies
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Content policies (public read, admin write)
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

-- Social policies
CREATE POLICY "Posts are viewable by everyone" ON public.posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Like policies
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.post_likes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own comment likes" ON public.comment_likes
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Follow policies
CREATE POLICY "Follows are viewable by everyone" ON public.user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON public.user_follows
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = follower_id));

-- Block policies
CREATE POLICY "Users can view their own blocks" ON public.user_blocks
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = blocker_id));

CREATE POLICY "Users can manage their own blocks" ON public.user_blocks
    FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = blocker_id));

-- Report policies
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = reporter_id));

CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = reporter_id));

-- Ticket policies
CREATE POLICY "Users can view their own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own tickets" ON public.tickets
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

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

-- Notification policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

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

-- Similar admin policies for other content tables...
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );
