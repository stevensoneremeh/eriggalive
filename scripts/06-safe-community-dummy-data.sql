-- First, let's check if we have users and create some if needed
DO $$
DECLARE
    user_count INTEGER;
    first_user_id BIGINT;
    second_user_id BIGINT;
    third_user_id BIGINT;
    bars_category_id BIGINT;
    stories_category_id BIGINT;
    events_category_id BIGINT;
    general_category_id BIGINT;
BEGIN
    -- Check how many users we have
    SELECT COUNT(*) INTO user_count FROM users;
    
    -- If we don't have enough users, let's use the first available user for all posts
    IF user_count = 0 THEN
        RAISE EXCEPTION 'No users found in the database. Please create users first.';
    END IF;
    
    -- Get existing user IDs
    SELECT id INTO first_user_id FROM users ORDER BY id LIMIT 1;
    SELECT id INTO second_user_id FROM users ORDER BY id LIMIT 1 OFFSET 1;
    SELECT id INTO third_user_id FROM users ORDER BY id LIMIT 1 OFFSET 2;
    
    -- Use first user if we don't have enough users
    IF second_user_id IS NULL THEN second_user_id := first_user_id; END IF;
    IF third_user_id IS NULL THEN third_user_id := first_user_id; END IF;
    
    -- Get category IDs
    SELECT id INTO bars_category_id FROM community_categories WHERE slug = 'bars';
    SELECT id INTO stories_category_id FROM community_categories WHERE slug = 'stories';
    SELECT id INTO events_category_id FROM community_categories WHERE slug = 'events';
    SELECT id INTO general_category_id FROM community_categories WHERE slug = 'general';
    
    -- If categories don't exist, create them
    IF bars_category_id IS NULL THEN
        INSERT INTO community_categories (name, slug, description, is_active, display_order) 
        VALUES ('Bars', 'bars', 'Share your favorite bars and lyrics', true, 1)
        RETURNING id INTO bars_category_id;
    END IF;
    
    IF stories_category_id IS NULL THEN
        INSERT INTO community_categories (name, slug, description, is_active, display_order) 
        VALUES ('Stories', 'stories', 'Tell your stories and experiences', true, 2)
        RETURNING id INTO stories_category_id;
    END IF;
    
    IF events_category_id IS NULL THEN
        INSERT INTO community_categories (name, slug, description, is_active, display_order) 
        VALUES ('Events', 'events', 'Upcoming events and announcements', true, 3)
        RETURNING id INTO events_category_id;
    END IF;
    
    IF general_category_id IS NULL THEN
        INSERT INTO community_categories (name, slug, description, is_active, display_order) 
        VALUES ('General', 'general', 'General discussions and conversations', true, 4)
        RETURNING id INTO general_category_id;
    END IF;
    
    -- Now insert dummy posts with valid user IDs
    INSERT INTO community_posts (user_id, category_id, content, vote_count, is_published, is_deleted, created_at) VALUES
    (first_user_id, bars_category_id, 'Just dropped some fire bars! 🔥 Check out my latest freestyle session. The energy was unreal!', 15, true, false, NOW() - INTERVAL '2 hours'),
    (second_user_id, stories_category_id, 'Remember when Erigga first started? His journey from the streets to stardom is truly inspiring. What''s your favorite Erigga track of all time?', 8, true, false, NOW() - INTERVAL '4 hours'),
    (third_user_id, events_category_id, 'Who''s going to the Lagos show next month? I''ve got my tickets and I''m so hyped! 🎤🎵', 12, true, false, NOW() - INTERVAL '6 hours'),
    (first_user_id, general_category_id, 'Good morning Erigga family! Hope everyone is having a blessed day. Remember to stay focused on your goals! 💪', 5, true, false, NOW() - INTERVAL '8 hours'),
    (second_user_id, bars_category_id, 'Working on some new material. The studio sessions have been crazy productive lately. Can''t wait to share what we''ve been cooking! 🎵', 20, true, false, NOW() - INTERVAL '12 hours'),
    (third_user_id, stories_category_id, 'That time Erigga performed at my university was legendary! The crowd went absolutely wild. Still gives me chills thinking about it.', 7, true, false, NOW() - INTERVAL '1 day'),
    (first_user_id, events_category_id, 'Concert announcement coming soon! Keep your eyes peeled for something special. It''s going to be epic! 👀', 25, true, false, NOW() - INTERVAL '1 day 2 hours'),
    (second_user_id, general_category_id, 'Shoutout to all the real fans who''ve been supporting from day one. Your energy keeps us going! Much love ❤️', 18, true, false, NOW() - INTERVAL '1 day 4 hours'),
    (third_user_id, bars_category_id, 'Just finished a crazy freestyle session with the crew. The bars were flowing like water! Who wants to hear it?', 11, true, false, NOW() - INTERVAL '1 day 8 hours'),
    (first_user_id, stories_category_id, 'Throwback to that iconic music video shoot. Behind the scenes was even more fun than what you saw! 📸', 9, true, false, NOW() - INTERVAL '2 days');
    
    RAISE NOTICE 'Successfully created dummy posts with user IDs: %, %, %', first_user_id, second_user_id, third_user_id;
END $$;
