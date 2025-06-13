-- Insert comprehensive seed data

-- First, we need to create auth users manually in Supabase Auth
-- Then we'll insert the corresponding user profiles

-- Sample albums with rich metadata
INSERT INTO public.albums (title, slug, description, cover_url, type, genre, release_date, total_tracks, duration_seconds, is_premium, required_tier, coin_price, play_count, producer, record_label, tags) VALUES
('The Erigma', 'the-erigma', 'The breakthrough album that established Erigga as the Paper Boi of South-South Nigeria', '/placeholder.svg?height=400&width=400&text=The+Erigma', 'album', 'Afro Hip-Hop', '2019-02-14', 17, 3765, false, 'grassroot', 0, 2500000, 'Kel-P, Popito', 'Emirate Empire', ARRAY['hip-hop', 'afrobeats', 'street']),

('The Erigma II', 'the-erigma-ii', 'The highly anticipated sequel featuring collaborations with top Nigerian artists', '/placeholder.svg?height=400&width=400&text=The+Erigma+II', 'album', 'Afro Hip-Hop', '2020-10-30', 15, 3512, false, 'grassroot', 0, 3200000, 'Kel-P, Popito, Vstix', 'Emirate Empire', ARRAY['hip-hop', 'afrobeats', 'collaboration']),

('Street Motivation', 'street-motivation', 'Raw street stories and motivational tracks for the hustlers', '/placeholder.svg?height=400&width=400&text=Street+Motivation', 'mixtape', 'Street Hip-Hop', '2021-06-15', 12, 2718, true, 'pioneer', 75, 1800000, 'Kel-P, Popito', 'Emirate Empire', ARRAY['street', 'motivation', 'hustle']),

('Blood & Sweat', 'blood-and-sweat', 'Premium exclusive album showcasing Erigga''s versatility and growth', '/placeholder.svg?height=400&width=400&text=Blood+Sweat', 'album', 'Afro Hip-Hop', '2023-12-01', 20, 4530, true, 'blood', 200, 500000, 'Kel-P, Vstix, Popito', 'Emirate Empire', ARRAY['premium', 'exclusive', 'growth']),

('Paper Boi Chronicles', 'paper-boi-chronicles', 'The definitive collection of Erigga''s greatest hits and unreleased tracks', '/placeholder.svg?height=400&width=400&text=Paper+Boi+Chronicles', 'compilation', 'Afro Hip-Hop', '2024-01-15', 25, 5625, true, 'elder', 150, 750000, 'Various', 'Emirate Empire', ARRAY['greatest-hits', 'compilation', 'unreleased']);

-- Sample tracks with comprehensive metadata
INSERT INTO public.tracks (album_id, title, slug, artist, featuring, duration_seconds, track_number, lyrics, cover_url, release_date, play_count, is_premium, required_tier, coin_price, genre, producer, songwriter, tags) VALUES
(1, 'Send Her Money', 'send-her-money', 'Erigga', 'Yemi Alade', 225, 1, 'Send her money, send her money...', '/placeholder.svg?height=400&width=400&text=Send+Her+Money', '2019-02-14', 5200000, false,  'grassroot', 0, 'Afrobeats', 'Kel-P', 'Erigga', ARRAY['love', 'money', 'relationship']),

(1, 'Motivation', 'motivation', 'Erigga', 'Victor AD', 198, 2, 'Every day I wake up with motivation...', '/placeholder.svg?height=400&width=400&text=Motivation', '2019-02-14', 3800000, false, 'grassroot', 0, 'Hip-Hop', 'Popito', 'Erigga', ARRAY['motivation', 'hustle', 'success']),

(2, 'The Erigma II', 'the-erigma-ii-title', 'Erigga', NULL, 210, 1, 'Welcome to the Erigma II...', '/placeholder.svg?height=400&width=400&text=Erigma+II', '2020-10-30', 2100000, false, 'grassroot', 0, 'Hip-Hop', 'Kel-P', 'Erigga', ARRAY['intro', 'erigma', 'sequel']),

(3, 'Street Credibility', 'street-credibility', 'Erigga', 'Zlatan', 187, 1, 'Street credibility na wetin I get...', '/placeholder.svg?height=400&width=400&text=Street+Credibility', '2021-06-15', 1500000, true, 'pioneer', 25, 'Street Hip-Hop', 'Popito', 'Erigga', ARRAY['street', 'credibility', 'respect']),

(4, 'Blood Money', 'blood-money', 'Erigga', 'Phyno', 245, 1, 'Blood money no dey pay...', '/placeholder.svg?height=400&width=400&text=Blood+Money', '2023-12-01', 800000, true, 'blood', 50, 'Afro Hip-Hop', 'Vstix', 'Erigga', ARRAY['premium', 'philosophy', 'money']),

(5, 'Paper Boi Anthem', 'paper-boi-anthem', 'Erigga', NULL, 267, 1, 'Paper Boi, Paper Boi, that''s my name...', '/placeholder.svg?height=400&width=400&text=Paper+Boi+Anthem', '2024-01-15', 1200000, true, 'elder', 35, 'Hip-Hop', 'Kel-P', 'Erigga', ARRAY['anthem', 'paper-boi', 'identity']);

-- Streaming platform links
INSERT INTO public.streaming_links (track_id, platform, url, platform_id, is_verified) VALUES
(1, 'spotify', 'https://open.spotify.com/track/send-her-money', 'spotify_123456', true),
(1, 'apple_music', 'https://music.apple.com/track/send-her-money', 'apple_123456', true),
(1, 'audiomack', 'https://audiomack.com/erigga/song/send-her-money', 'audiomack_123456', true),
(2, 'spotify', 'https://open.spotify.com/track/motivation', 'spotify_234567', true),
(2, 'apple_music', 'https://music.apple.com/track/motivation', 'apple_234567', true),
(3, 'spotify', 'https://open.spotify.com/track/erigma-ii', 'spotify_345678', true),
(4, 'audiomack', 'https://audiomack.com/erigga/song/street-credibility', 'audiomack_456789', true),
(5, 'spotify', 'https://open.spotify.com/track/blood-money', 'spotify_567890', true);

-- Music videos
INSERT INTO public.music_videos (track_id, title, slug, description, video_url, thumbnail_url, duration_seconds, views, likes, release_date, director, producer, location, tags) VALUES
(1, 'Send Her Money (Official Video)', 'send-her-money-video', 'The official music video for Send Her Money featuring Yemi Alade', 'https://youtube.com/watch?v=send-her-money', '/placeholder.svg?height=360&width=640&text=Send+Her+Money+Video', 245, 8500000, 125000, '2019-03-01', 'Clarence Peters', 'Capital Dreams', 'Lagos, Nigeria', ARRAY['official-video', 'yemi-alade', 'love']),

(2, 'Motivation (Official Video)', 'motivation-video', 'The official music video for Motivation featuring Victor AD', 'https://youtube.com/watch?v=motivation', '/placeholder.svg?height=360&width=640&text=Motivation+Video', 218, 6200000, 98000, '2019-04-15', 'TG Omori', 'Boy Director', 'Warri, Nigeria', ARRAY['official-video', 'victor-ad', 'motivation']),

(3, 'The Erigma II (Official Video)', 'erigma-ii-video', 'The official music video for The Erigma II title track', 'https://youtube.com/watch?v=erigma-ii', '/placeholder.svg?height=360&width=640&text=Erigma+II+Video', 230, 3800000, 67000, '2020-11-15', 'Unlimited LA', 'Emirate Empire', 'Benin City, Nigeria', ARRAY['official-video', 'erigma', 'sequel']);

-- Gallery items
INSERT INTO public.gallery_items (title, slug, description, image_url, category, subcategory, views, likes, photographer, location, taken_at, tags) VALUES
('Erigga Live in Lagos', 'erigga-live-lagos', 'Erigga performing at the Eko Hotel Lagos', '/placeholder.svg?height=600&width=800&text=Erigga+Live+Lagos', 'Performance', 'Concert', 15000, 2500, 'Kelechi Amadi-Obi', 'Eko Hotel, Lagos', '2023-12-15 20:30:00+01', ARRAY['concert', 'lagos', 'performance']),

('Studio Session', 'studio-session-2024', 'Behind the scenes in the studio working on new music', '/placeholder.svg?height=600&width=800&text=Studio+Session', 'Behind The Scenes', 'Studio', 8500, 1200, 'Emmanuel Oyeleke', 'Emirate Studios, Warri', '2024-01-10 14:00:00+01', ARRAY['studio', 'recording', 'behind-scenes']),

('Paper Boi Portrait', 'paper-boi-portrait', 'Professional portrait shoot for Paper Boi Chronicles album', '/placeholder.svg?height=800&width=600&text=Paper+Boi+Portrait', 'Portrait', 'Professional', 12000, 1800, 'Ty Bello', 'Lagos, Nigeria', '2023-11-20 10:00:00+01', ARRAY['portrait', 'professional', 'album-cover']),

('Street Chronicles', 'street-chronicles-shoot', 'Photo shoot capturing the essence of street life', '/placeholder.svg?height=600&width=800&text=Street+Chronicles', 'Lifestyle', 'Street', 9500, 1400, 'Lakin Ogunbanwo', 'Warri, Nigeria', '2023-10-05 16:00:00+01', ARRAY['street', 'lifestyle', 'authentic']),

('Award Night', 'award-night-2023', 'Erigga at the Nigerian Music Awards 2023', '/placeholder.svg?height=600&width=800&text=Award+Night', 'Events', 'Awards', 18000, 3200, 'George Okoro', 'Eko Convention Centre, Lagos', '2023-11-25 19:00:00+01', ARRAY['awards', 'formal', 'recognition']);

-- Events
INSERT INTO public.events (title, slug, description, venue, address, city, state, date, ticket_price, vip_price, max_tickets, max_vip_tickets, image_url, organizer, contact_email, tags) VALUES
('Erigga Live in Concert - Lagos', 'erigga-live-lagos-2024', 'The biggest Erigga concert of the year featuring special guests and surprise performances', 'Eko Hotel Convention Centre', 'Plot 1415, Adetokunbo Ademola Street, Victoria Island', 'Lagos', 'Lagos', '2024-12-15 20:00:00+01', 15000.00, 50000.00, 5000, 500, '/placeholder.svg?height=400&width=600&text=Erigga+Live+Lagos', 'Emirate Empire', 'events@emirateempire.com', ARRAY['concert', 'live-music', 'lagos']),

('Paper Boi Chronicles Album Launch', 'paper-boi-chronicles-launch', 'Exclusive album launch party with live performances and meet & greet', 'Terra Kulture Arena', '1376 Tiamiyu Savage Street, Victoria Island', 'Lagos', 'Lagos', '2024-02-14 19:00:00+01', 25000.00, 75000.00, 1000, 100, '/placeholder.svg?height=400&width=600&text=Album+Launch', 'Emirate Empire', 'events@emirateempire.com', ARRAY['album-launch', 'exclusive', 'meet-greet']),

('Warri Homecoming Concert', 'warri-homecoming-2024', 'Erigga returns home to Warri for a special homecoming concert', 'Warri Township Stadium', 'Warri Township Stadium, Warri', 'Warri', 'Delta', '2024-08-01 18:00:00+01', 8000.00, 25000.00, 10000, 1000, '/placeholder.svg?height=400&width=600&text=Warri+Homecoming', 'Emirate Empire', 'events@emirateempire.com', ARRAY['homecoming', 'warri', 'special']);

-- Products (Merchandise)
INSERT INTO public.products (name, slug, description, price, images, category, brand, sku, stock_quantity, is_featured, tags) VALUES
('Paper Boi Official T-Shirt', 'paper-boi-tshirt', 'Premium quality cotton t-shirt with Paper Boi logo', 8500.00, ARRAY['/placeholder.svg?height=400&width=400&text=Paper+Boi+Tshirt'], 'Clothing', 'Erigga Official', 'PB-TSHIRT-001', 500, true, ARRAY['clothing', 'tshirt', 'paper-boi']),

('Erigma Hoodie', 'erigma-hoodie', 'Comfortable hoodie featuring The Erigma album artwork', 15000.00, ARRAY['/placeholder.svg?height=400&width=400&text=Erigma+Hoodie'], 'Clothing', 'Erigga Official', 'EG-HOODIE-001', 200, true, ARRAY['clothing', 'hoodie', 'erigma']),

('Emirate Empire Cap', 'emirate-empire-cap', 'Snapback cap with embroidered Emirate Empire logo', 6500.00, ARRAY['/placeholder.svg?height=400&width=400&text=Emirate+Cap'], 'Accessories', 'Erigga Official', 'EE-CAP-001', 300, false, ARRAY['accessories', 'cap', 'emirate']),

('Street Motivation Poster', 'street-motivation-poster', 'High-quality poster featuring Street Motivation album artwork', 3500.00, ARRAY['/placeholder.svg?height=400&width=400&text=Street+Poster'], 'Art', 'Erigga Official', 'SM-POSTER-001', 150, false, ARRAY['art', 'poster', 'street-motivation']),

('Paper Boi Phone Case', 'paper-boi-phone-case', 'Protective phone case with Paper Boi design (Multiple phone models available)', 4500.00, ARRAY['/placeholder.svg?height=400&width=400&text=Phone+Case'], 'Accessories', 'Erigga Official', 'PB-CASE-001', 400, true, ARRAY['accessories', 'phone-case', 'paper-boi']);

-- Sample posts for community
INSERT INTO public.posts (user_id, content, type, like_count, comment_count, view_count, is_featured, tags, hashtags) VALUES
(1, 'New music coming soon! Been working on something special for my Paper Boi family. The studio sessions have been incredible and I can''t wait to share what we''ve been cooking. Stay tuned! 🔥🎵', 'announcement', 2500, 180, 15000, true, ARRAY['music', 'announcement'], ARRAY['newmusic', 'paperboi', 'studiotime']),

(1, 'Throwback to the Warri homecoming concert. The energy was unmatched! Thank you to everyone who came out to show love. Warri will always be home ❤️', 'general', 1800, 120, 8500, false, ARRAY['throwback', 'concert'], ARRAY['warri', 'homecoming', 'love']),

(1, 'Motivation Monday: Remember, your current situation is not your final destination. Keep pushing, keep grinding. Success is a journey, not a destination. 💪', 'general', 3200, 250, 12000, true, ARRAY['motivation', 'inspiration'], ARRAY['motivationmonday', 'success', 'grind']);

-- Notifications for system messages
INSERT INTO public.notifications (user_id, type, title, message, data) VALUES
(1, 'system', 'Welcome to Erigga Live!', 'Thank you for joining the Paper Boi family. Explore exclusive content, connect with other fans, and stay updated with the latest from Erigga.', '{"welcome": true, "tier": "grassroot"}'),
(2, 'tier_upgrade', 'Tier Upgraded!', 'Congratulations! You have been upgraded to Pioneer tier. Enjoy exclusive content and special privileges.', '{"old_tier": "grassroot", "new_tier": "pioneer", "bonus_coins": 100}'),
(3, 'content', 'New Album Released!', 'Paper Boi Chronicles is now available! Check out the latest tracks and exclusive content.', '{"album_id": 5, "album_title": "Paper Boi Chronicles"}');
