-- Insert dummy users for each tier (these will be created after auth users are created)
-- Note: You'll need to create these auth users first in Supabase Auth, then run this script

-- Dummy albums
INSERT INTO public.albums (title, description, cover_url, type, release_date, total_tracks, duration, is_premium, required_tier, coin_price, play_count) VALUES
('The Erigma', 'The breakthrough album that established Erigga as the Paper Boi', '/placeholder.svg?height=400&width=400&text=The+Erigma', 'album', '2019-02-14', 17, '1:02:45', false, 'grassroot', 0, 2500000),
('The Erigma II', 'The highly anticipated sequel featuring collaborations with top artists', '/placeholder.svg?height=400&width=400&text=The+Erigma+II', 'album', '2020-10-30', 15, '58:32', false, 'grassroot', 0, 3200000),
('Street Motivation', 'Raw street stories and motivational tracks', '/placeholder.svg?height=400&width=400&text=Street+Motivation', 'mixtape', '2021-06-15', 12, '45:18', true, 'pioneer', 75, 1800000),
('Blood & Sweat', 'Premium exclusive album for top tier fans', '/placeholder.svg?height=400&width=400&text=Blood+Sweat', 'album', '2023-12-01', 20, '1:15:30', true, 'blood', 200, 500000);

-- Dummy tracks
INSERT INTO public.tracks (album_id, title, artist, featuring, duration, track_number, cover_url, release_date, play_count, is_premium, required_tier, coin_price) VALUES
(1, 'Send Her Money', 'Erigga', 'Yemi Alade', '3:45', 1, '/placeholder.svg?height=400&width=400&text=Send+Her+Money', '2019-02-14', 5200000, false, 'grassroot', 0),
(1, 'The Fear of God', 'Erigga', NULL, '4:12', 2, '/placeholder.svg?height=400&width=400&text=Fear+of+God', '2019-02-14', 3800000, false, 'grassroot', 0),
(2, 'Area to the World', 'Erigga', 'Zlatan', '3:28', 1, '/placeholder.svg?height=400&width=400&text=Area+to+World', '2020-10-30', 4100000, false, 'grassroot', 0),
(3, 'Street Anthem', 'Erigga', NULL, '4:05', 1, '/placeholder.svg?height=400&width=400&text=Street+Anthem', '2021-06-15', 1200000, true, 'pioneer', 25),
(4, 'Blood Money', 'Erigga', 'Burna Boy', '3:55', 1, '/placeholder.svg?height=400&width=400&text=Blood+Money', '2023-12-01', 800000, true, 'blood', 50);

-- Dummy streaming links
INSERT INTO public.streaming_links (track_id, platform, url) VALUES
(1, 'spotify', 'https://open.spotify.com/track/send-her-money'),
(1, 'apple_music', 'https://music.apple.com/track/send-her-money'),
(1, 'audiomack', 'https://audiomack.com/erigga/song/send-her-money'),
(2, 'spotify', 'https://open.spotify.com/track/fear-of-god'),
(2, 'youtube_music', 'https://music.youtube.com/track/fear-of-god'),
(3, 'audiomack', 'https://audiomack.com/erigga/song/area-to-the-world');

-- Dummy music videos
INSERT INTO public.music_videos (track_id, title, description, video_url, thumbnail_url, duration, views, release_date, is_premium, required_tier, coin_price) VALUES
(1, 'Send Her Money (Official Video)', 'Official music video for Send Her Money featuring Yemi Alade', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/placeholder.svg?height=300&width=500&text=Send+Her+Money+Video', '4:15', 8500000, '2019-02-20', false, 'grassroot', 0),
(2, 'The Fear of God (Official Video)', 'Official music video for The Fear of God', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/placeholder.svg?height=300&width=500&text=Fear+of+God+Video', '4:42', 6200000, '2019-03-01', false, 'grassroot', 0),
(5, 'Blood Money (Exclusive Video)', 'Exclusive video for Blood tier members only', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/placeholder.svg?height=300&width=500&text=Blood+Money+Video', '4:30', 500000, '2023-12-05', true, 'blood', 100);

-- Dummy gallery items
INSERT INTO public.gallery_items (title, description, image_url, category, is_premium, required_tier, coin_price) VALUES
('Studio Session 2024', 'Behind the scenes in the studio', '/placeholder.svg?height=400&width=600&text=Studio+Session', 'Behind The Scenes', false, 'grassroot', 0),
('Concert Performance Lagos', 'Live performance at Eko Hotel', '/placeholder.svg?height=400&width=600&text=Concert+Lagos', 'Live Shows', false, 'grassroot', 0),
('Album Cover Shoot', 'Professional photoshoot for latest album', '/placeholder.svg?height=400&width=600&text=Album+Cover+Shoot', 'Photoshoot', true, 'pioneer', 15),
('Exclusive Meet & Greet', 'Private meet and greet with fans', '/placeholder.svg?height=400&width=600&text=Meet+Greet', 'Exclusive', true, 'elder', 30),
('Blood Tier Dinner', 'Exclusive dinner with Blood tier members', '/placeholder.svg?height=400&width=600&text=Blood+Dinner', 'Exclusive', true, 'blood', 50);

-- Dummy events
INSERT INTO public.events (title, description, venue, location, date, ticket_price, max_tickets, tickets_sold, image_url, is_active) VALUES
('Erigga Live in Lagos', 'The biggest concert of the year featuring Erigga and special guests', 'Eko Hotel & Suites', 'Lagos, Nigeria', '2024-12-31 20:00:00+01', 15000.00, 5000, 1250, '/placeholder.svg?height=400&width=600&text=Erigga+Live+Lagos', true),
('Street Motivation Tour - Abuja', 'Street Motivation album tour coming to Abuja', 'International Conference Centre', 'Abuja, Nigeria', '2024-11-15 19:00:00+01', 10000.00, 3000, 800, '/placeholder.svg?height=400&width=600&text=Street+Tour+Abuja', true),
('Warri Homecoming', 'Special homecoming concert in Warri', 'Warri Township Stadium', 'Warri, Nigeria', '2024-10-20 18:00:00+01', 8000.00, 8000, 6500, '/placeholder.svg?height=400&width=600&text=Warri+Homecoming', true);

-- Dummy products
INSERT INTO public.products (name, description, price, images, sizes, category, is_premium_only, coin_price, stock_quantity, is_active) VALUES
('Paper Boi T-Shirt', 'Official Erigga Paper Boi merchandise t-shirt', 8000.00, ARRAY['/placeholder.svg?height=400&width=400&text=Paper+Boi+Tshirt'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 'Clothing', false, 80, 500, true),
('Erigga Hoodie', 'Premium quality hoodie with Erigga branding', 15000.00, ARRAY['/placeholder.svg?height=400&width=400&text=Erigga+Hoodie'], ARRAY['S', 'M', 'L', 'XL'], 'Clothing', false, 150, 200, true),
('Blood Tier Exclusive Cap', 'Limited edition cap only for Blood tier members', 12000.00, ARRAY['/placeholder.svg?height=400&width=400&text=Blood+Cap'], ARRAY['One Size'], 'Accessories', true, 120, 50, true),
('Signed Album Cover', 'Personally signed album cover by Erigga', 25000.00, ARRAY['/placeholder.svg?height=400&width=400&text=Signed+Album'], ARRAY['One Size'], 'Collectibles', true, 250, 25, true);

-- Dummy posts (will be created after users are seeded)
-- These will be inserted after the auth users are created

-- Dummy media content
INSERT INTO public.media_content (title, description, type, file_url, thumbnail_url, duration, is_premium, required_tier, coin_price, view_count) VALUES
('Freestyle Friday #1', 'Weekly freestyle session', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/placeholder.svg?height=300&width=500&text=Freestyle+1', 180, false, 'grassroot', 0, 15000),
('Studio Diary Episode 1', 'Behind the scenes studio content', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/placeholder.svg?height=300&width=500&text=Studio+Diary', 600, true, 'pioneer', 25, 8000),
('Exclusive Interview', 'One-on-one interview with Erigga', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/placeholder.svg?height=300&width=500&text=Exclusive+Interview', 1200, true, 'elder', 50, 3000),
('Blood Tier Podcast', 'Private podcast for Blood tier members', 'audio', 'https://www.soundcloud.com/dummy-audio', '/placeholder.svg?height=300&width=500&text=Blood+Podcast', 2400, true, 'blood', 75, 500);
