-- Create users first
INSERT INTO users (auth_user_id, username, email, full_name, tier, coins, level, points, avatar_url, bio, is_active, created_at) VALUES
('user-1-auth-id', 'erigga_official', 'erigga@official.com', 'Erigga', 'admin', 10000, 50, 5000, '/placeholder-user.jpg', 'The Paper Boi himself', true, NOW() - INTERVAL '1 year'),
('user-2-auth-id', 'bars_king', 'barsking@email.com', 'Bars King', 'blood_brotherhood', 5000, 25, 2500, '/placeholder-user.jpg', 'Spitting fire bars daily', true, NOW() - INTERVAL '6 months'),
('user-3-auth-id', 'street_poet', 'poet@street.com', 'Street Poet', 'elder', 3000, 20, 2000, '/placeholder-user.jpg', 'Poetry from the streets', true, NOW() - INTERVAL '3 months'),
('user-4-auth-id', 'lyric_master', 'lyrics@master.com', 'Lyric Master', 'pioneer', 1500, 15, 1500, '/placeholder-user.jpg', 'Master of wordplay', true, NOW() - INTERVAL '2 months'),
('user-5-auth-id', 'fan_number1', 'fan1@email.com', 'Fan Number 1', 'grassroot', 500, 5, 500, '/placeholder-user.jpg', 'Biggest Erigga fan', true, NOW() - INTERVAL '1 month')
ON CONFLICT (auth_user_id) DO NOTHING;

-- Create categories
INSERT INTO community_categories (name, slug, description, is_active, display_order, created_at) VALUES
('General', 'general', 'General discussions and conversations', true, 1, NOW()),
('Bars', 'bars', 'Share your favorite bars and lyrics', true, 2, NOW()),
('Stories', 'stories', 'Tell your stories and experiences', true, 3, NOW()),
('Events', 'events', 'Upcoming events and announcements', true, 4, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Get the user and category IDs we just created
DO $$
DECLARE
    user1_id BIGINT;
    user2_id BIGINT;
    user3_id BIGINT;
    user4_id BIGINT;
    user5_id BIGINT;
    general_cat_id BIGINT;
    bars_cat_id BIGINT;
    stories_cat_id BIGINT;
    events_cat_id BIGINT;
BEGIN
    -- Get user IDs
    SELECT id INTO user1_id FROM users WHERE username = 'erigga_official';
    SELECT id INTO user2_id FROM users WHERE username = 'bars_king';
    SELECT id INTO user3_id FROM users WHERE username = 'street_poet';
    SELECT id INTO user4_id FROM users WHERE username = 'lyric_master';
    SELECT id INTO user5_id FROM users WHERE username = 'fan_number1';
    
    -- Get category IDs
    SELECT id INTO general_cat_id FROM community_categories WHERE slug = 'general';
    SELECT id INTO bars_cat_id FROM community_categories WHERE slug = 'bars';
    SELECT id INTO stories_cat_id FROM community_categories WHERE slug = 'stories';
    SELECT id INTO events_cat_id FROM community_categories WHERE slug = 'events';
    
    -- Create posts with the actual IDs
    INSERT INTO community_posts (user_id, category_id, content, vote_count, is_published, is_deleted, created_at) VALUES
    (user1_id, general_cat_id, 'Welcome to the official Erigga community! 🎵 This is where we connect, share, and celebrate the culture. Drop your favorite Erigga lyrics below! #PaperBoi', 45, true, false, NOW() - INTERVAL '1 hour'),
    
    (user2_id, bars_cat_id, 'Just dropped some fire bars! 🔥🔥🔥

"Money dey my pocket, I no dey fear anybody
Na God dey my back, I no need security
From Warri to Lagos, dem know say I dey carry
The streets dey feel me, my story legendary"

What y''all think? Rate this bar 1-10! 💯', 38, true, false, NOW() - INTERVAL '2 hours'),
    
    (user3_id, stories_cat_id, 'Real talk: Remember when Erigga first started and nobody believed in the sound? Now look at where we are! 🙌 

That''s why I never give up on my dreams. If Paper Boi can make it from the streets to the top, we all can make it too. What''s your biggest dream right now? Let''s motivate each other! 💪', 29, true, false, NOW() - INTERVAL '3 hours'),
    
    (user4_id, events_cat_id, 'YO! Who else is going to the Lagos concert next month?! 🎤🎵 

I''ve been waiting for this for months! The energy is going to be INSANE! If you''re going, drop a comment so we can link up. Let''s make this the biggest Erigga concert ever! 

#EriggaLive #LagosShow #PaperBoiTour', 52, true, false, NOW() - INTERVAL '4 hours'),
    
    (user5_id, general_cat_id, 'Good morning Erigga family! ☀️ 

Hope everyone is having a blessed day. Just wanted to say this community is everything! The love, the support, the real conversations - this is what it''s all about. 

Remember: Stay focused, stay grinding, and keep supporting each other! Much love ❤️', 15, true, false, NOW() - INTERVAL '5 hours'),
    
    (user2_id, bars_cat_id, 'Working on some new material in the studio 🎵🎤

The sessions have been CRAZY productive lately. Can''t wait to share what we''ve been cooking! The beats are hitting different and the bars are flowing like water 💧

Who wants a sneak peek? Drop a 🔥 if you''re ready for new heat!', 41, true, false, NOW() - INTERVAL '6 hours'),
    
    (user3_id, stories_cat_id, 'Throwback story time! 📖

That time Erigga performed at my university was LEGENDARY! The crowd went absolutely WILD! People were jumping, singing every word, the energy was electric ⚡

I still get chills thinking about when he performed "Paper Boi" and the whole place erupted! That''s when I knew this man was special. What''s your favorite Erigga live performance memory?', 22, true, false, NOW() - INTERVAL '8 hours'),
    
    (user1_id, events_cat_id, '🚨 BIG ANNOUNCEMENT COMING SOON! 🚨

Keep your eyes peeled for something SPECIAL dropping this week! I can''t say too much yet but... let''s just say it''s going to be EPIC! 👀

The team has been working hard behind the scenes and we''re ready to give you something you''ve never seen before! Stay tuned! 

#ComingSoon #BigThings #PaperBoiMovement', 67, true, false, NOW() - INTERVAL '10 hours'),
    
    (user4_id, bars_cat_id, 'Freestyle Friday! 🎤

Just finished a crazy freestyle session with the crew. The bars were flowing like a river! Here''s a taste:

"Started from the bottom now we climbing to the peak
Every single day we getting stronger, never weak
Erigga taught us how to hustle, how to speak
Now we spitting fire bars, making haters weep"

Who wants to drop their own bars in the comments? Let''s see what you got! 🔥', 33, true, false, NOW() - INTERVAL '12 hours'),
    
    (user5_id, general_cat_id, 'Shoutout Sunday! 📢

Massive shoutout to all the REAL fans who''ve been supporting from day one! Your energy, your love, your loyalty - that''s what keeps this movement alive! 

Whether you''ve been here since the beginning or just joined the family, you''re appreciated! Let''s keep growing this community and spreading the Paper Boi message worldwide! 🌍

Tag someone who introduced you to Erigga''s music! ❤️', 28, true, false, NOW() - INTERVAL '1 day');
    
    RAISE NOTICE 'Successfully created all users, categories, and posts!';
END $$;
