-- This script should be run AFTER creating the auth users in Supabase Auth
-- Replace the auth_user_id values with actual UUIDs from your Supabase Auth users

-- Test user for Grassroot tier
INSERT INTO public.users (auth_user_id, username, full_name, tier, level, points, coins, bio, location) VALUES
('00000000-0000-0000-0000-000000000001', 'grassroot_fan', 'John Grassroot', 'grassroot', 1, 100, 50, 'New fan of Erigga, just joined the movement!', 'Lagos, Nigeria');

-- Test user for Pioneer tier  
INSERT INTO public.users (auth_user_id, username, full_name, tier, level, points, coins, bio, location) VALUES
('00000000-0000-0000-0000-000000000002', 'pioneer_supporter', 'Sarah Pioneer', 'pioneer', 5, 2500, 500, 'Long-time supporter of the Paper Boi!', 'Abuja, Nigeria');

-- Test user for Elder tier
INSERT INTO public.users (auth_user_id, username, full_name, tier, level, points, coins, bio, location) VALUES
('00000000-0000-0000-0000-000000000003', 'elder_veteran', 'Mike Elder', 'elder', 12, 8000, 1500, 'Been following Erigga since day one. Elder of the community.', 'Port Harcourt, Nigeria');

-- Test user for Blood tier
INSERT INTO public.users (auth_user_id, username, full_name, tier, level, points, coins, bio, location) VALUES
('00000000-0000-0000-0000-000000000004', 'blood_loyalist', 'Ada Blood', 'blood', 25, 25000, 5000, 'Ultimate Erigga fan. Blood tier for life!', 'Warri, Nigeria');

-- Admin user (Blood tier with admin privileges)
INSERT INTO public.users (auth_user_id, username, full_name, tier, level, points, coins, bio, location) VALUES
('00000000-0000-0000-0000-000000000005', 'erigga_admin', 'Admin User', 'blood', 50, 100000, 10000, 'Platform administrator', 'Lagos, Nigeria');

-- Add some sample posts from these users
INSERT INTO public.posts (user_id, content, type, like_count, comment_count, is_featured) VALUES
(1, 'Just joined the Erigga fan platform! This is amazing! 🔥', 'general', 15, 3, false),
(2, 'That new track is fire! Erigga never disappoints 🎵', 'bars', 45, 8, true),
(3, 'Been following Paper Boi since the beginning. The growth is incredible!', 'story', 78, 12, true),
(4, 'Blood tier exclusive content is worth every coin! 💎', 'general', 120, 25, true),
(5, 'Welcome to all new members! Let''s keep the community strong 💪', 'general', 200, 45, true);

-- Add some sample transactions
INSERT INTO public.coin_transactions (user_id, amount, transaction_type, payment_method, status, metadata) VALUES
(1, 100, 'purchase', 'paystack', 'completed', '{"reference": "pay_test_001"}'),
(2, 500, 'purchase', 'paystack', 'completed', '{"reference": "pay_test_002"}'),
(3, 1000, 'purchase', 'paystack', 'completed', '{"reference": "pay_test_003"}'),
(4, 2000, 'purchase', 'paystack', 'completed', '{"reference": "pay_test_004"}'),
(2, -25, 'content_access', 'coins', 'completed', '{"content_type": "video", "content_id": 2}'),
(3, -50, 'content_access', 'coins', 'completed', '{"content_type": "video", "content_id": 3}'),
(4, -75, 'content_access', 'coins', 'completed', '{"content_type": "audio", "content_id": 4}');

-- Add some content access records
INSERT INTO public.content_access (user_id, content_type, content_id, coins_spent, expires_at) VALUES
(2, 'video', 2, 25, NOW() + INTERVAL '30 days'),
(3, 'video', 3, 50, NOW() + INTERVAL '30 days'),
(4, 'audio', 4, 75, NOW() + INTERVAL '30 days');
