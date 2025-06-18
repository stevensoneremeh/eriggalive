-- This script should be run AFTER creating the auth users in Supabase Auth dashboard
-- Replace the UUIDs with the actual UUIDs from your Supabase Auth users

-- Test user profiles (you'll need to replace these UUIDs with actual ones from Supabase Auth)
INSERT INTO public.users (
    auth_user_id, 
    username, 
    full_name, 
    email, 
    tier, 
    role, 
    level, 
    points, 
    coins, 
    bio, 
    location, 
    is_verified, 
    email_verified
) VALUES 
-- Grassroot Tier User
('00000000-0000-0000-0000-000000000001', 'grassroot_fan', 'Grassroot Fan', 'grassroot@test.com', 'grassroot', 'user', 5, 250, 50, 'New to the Paper Boi family, loving the music!', 'Lagos, Nigeria', false, true),

-- Pioneer Tier User  
('00000000-0000-0000-0000-000000000002', 'pioneer_supporter', 'Pioneer Supporter', 'pioneer@test.com', 'pioneer', 'user', 15, 1500, 300, 'Been supporting Erigga since day one. Pioneer for life!', 'Warri, Delta', true, true),

-- Elder Tier User
('00000000-0000-0000-0000-000000000003', 'elder_vip', 'Elder VIP', 'elder@test.com', 'elder', 'user', 35, 5000, 1200, 'Elder status achieved through dedication to the Paper Boi movement.', 'Benin City, Edo', true, true),

-- Blood Tier User
('00000000-0000-0000-0000-000000000004', 'blood_legend', 'Blood Legend', 'blood@test.com', 'blood', 'user', 50, 15000, 5000, 'Blood tier member with exclusive access to everything Erigga.', 'Port Harcourt, Rivers', true, true),

-- Admin User
('00000000-0000-0000-0000-000000000005', 'admin_user', 'Admin User', 'admin@test.com', 'blood', 'admin', 100, 50000, 10000, 'Platform administrator managing the Erigga Live community.', 'Lagos, Nigeria', true, true),

-- Moderator User
('00000000-0000-0000-0000-000000000006', 'mod_user', 'Moderator User', 'moderator@test.com', 'elder', 'moderator', 75, 25000, 3000, 'Community moderator helping maintain a positive environment.', 'Abuja, FCT', true, true);

-- Create user settings for test users
INSERT INTO public.user_settings (user_id, theme, language, email_notifications, push_notifications) VALUES
(1, 'light', 'en', true, true),
(2, 'dark', 'en', true, true), 
(3, 'system', 'en', true, false),
(4, 'dark', 'en', false, true),
(5, 'system', 'en', true, true),
(6, 'light', 'en', true, true);

-- Sample coin transactions for test users
INSERT INTO public.coin_transactions (user_id, amount, transaction_type, status, description, metadata) VALUES
(1, 50, 'purchase', 'completed', 'Welcome bonus coins', '{"bonus": true, "welcome": true}'),
(2, 300, 'purchase', 'completed', 'Tier upgrade bonus', '{"tier_upgrade": "pioneer"}'),
(2, -25, 'content_access', 'completed', 'Purchased premium track access', '{"track_id": 4, "track_title": "Street Credibility"}'),
(3, 1200, 'purchase', 'completed', 'Tier upgrade bonus', '{"tier_upgrade": "elder"}'),
(3, -50, 'content_access', 'completed', 'Purchased premium album access', '{"album_id": 4, "album_title": "Blood & Sweat"}'),
(4, 5000, 'purchase', 'completed', 'Tier upgrade bonus', '{"tier_upgrade": "blood"}'),
(4, -200, 'content_access', 'completed', 'Purchased exclusive album', '{"album_id": 4, "album_title": "Blood & Sweat"}');

-- Sample content access for premium users
INSERT INTO public.content_access (user_id, content_type, content_id, access_type, coins_spent) VALUES
(2, 'track', 4, 'purchase', 25),
(3, 'album', 4, 'purchase', 50),
(3, 'album', 5, 'subscription', 0),
(4, 'album', 4, 'purchase', 200),
(4, 'album', 5, 'subscription', 0),
(4, 'track', 5, 'subscription', 0);

-- Sample tickets for test users
INSERT INTO public.tickets (
    user_id, 
    event_id, 
    ticket_number, 
    ticket_type, 
    qr_code, 
    status, 
    payment_reference, 
    amount_paid, 
    total_paid, 
    buyer_name, 
    buyer_email
) VALUES
(2, 1, 'TKT-LAG-001', 'regular', 'QR-LAG-001-REG', 'confirmed', 'PAY-REF-001', 15000.00, 15000.00, 'Pioneer Supporter', 'pioneer@test.com'),
(3, 1, 'TKT-LAG-002', 'vip', 'QR-LAG-002-VIP', 'confirmed', 'PAY-REF-002', 50000.00, 50000.00, 'Elder VIP', 'elder@test.com'),
(4, 2, 'TKT-ALB-001', 'vip', 'QR-ALB-001-VIP', 'confirmed', 'PAY-REF-003', 75000.00, 75000.00, 'Blood Legend', 'blood@test.com');

-- Sample orders for merchandise
INSERT INTO public.orders (
    user_id,
    order_number,
    status,
    payment_status,
    subtotal,
    total_amount,
    shipping_address,
    billing_address
) VALUES
(2, 'ORD-2024-001', 'delivered', 'completed', 8500.00, 8500.00, 
 '{"name": "Pioneer Supporter", "address": "123 Main Street", "city": "Warri", "state": "Delta", "country": "Nigeria", "postal_code": "332101"}',
 '{"name": "Pioneer Supporter", "address": "123 Main Street", "city": "Warri", "state": "Delta", "country": "Nigeria", "postal_code": "332101"}'
),
(3, 'ORD-2024-002', 'shipped', 'completed', 23500.00, 23500.00,
 '{"name": "Elder VIP", "address": "456 Elder Avenue", "city": "Benin City", "state": "Edo", "country": "Nigeria", "postal_code": "300001"}',
 '{"name": "Elder VIP", "address": "456 Elder Avenue", "city": "Benin City", "state": "Edo", "country": "Nigeria", "postal_code": "300001"}'
);

-- Sample order items
INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price, product_snapshot) VALUES
(1, 1, 1, 8500.00, 8500.00, '{"name": "Paper Boi Official T-Shirt", "size": "L", "color": "Black"}'),
(2, 1, 1, 8500.00, 8500.00, '{"name": "Paper Boi Official T-Shirt", "size": "XL", "color": "White"}'),
(2, 2, 1, 15000.00, 15000.00, '{"name": "Erigma Hoodie", "size": "L", "color": "Navy"}');

-- Sample user follows (fans following each other)
INSERT INTO public.user_follows (follower_id, following_id) VALUES
(1, 2), (1, 3), (1, 4),
(2, 3), (2, 4),
(3, 4);

-- Sample post likes
INSERT INTO public.post_likes (post_id, user_id, reaction_type) VALUES
(1, 2, 'love'), (1, 3, 'like'), (1, 4, 'love'),
(2, 1, 'like'), (2, 3, 'like'),
(3, 1, 'like'), (3, 2, 'love'), (3, 4, 'like');

-- Sample comments on posts
INSERT INTO public.comments (post_id, user_id, content, like_count) VALUES
(1, 2, 'Can''t wait for the new music! Paper Boi never disappoints 🔥', 15),
(1, 3, 'Been waiting for this! Elder tier ready for exclusive access', 8),
(2, 1, 'That concert was legendary! Warri showed mad love', 12),
(3, 4, 'This is why you''re the motivation king! Blood tier for life', 20);
