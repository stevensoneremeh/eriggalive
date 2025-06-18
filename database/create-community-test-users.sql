-- Create test users for each tier if they don't exist already
DO $$
DECLARE
    auth_uid_grassroot UUID;
    auth_uid_pioneer UUID;
    auth_uid_elder UUID;
    auth_uid_blood UUID;
    user_id_grassroot BIGINT;
    user_id_pioneer BIGINT;
    user_id_elder BIGINT;
    user_id_blood BIGINT;
BEGIN
    -- Create auth users if they don't exist
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data)
    VALUES 
        ('grassroot@test.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), '{"provider":"email","providers":["email"]}')
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO auth_uid_grassroot;
    
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data)
    VALUES 
        ('pioneer@test.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), '{"provider":"email","providers":["email"]}')
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO auth_uid_pioneer;
    
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data)
    VALUES 
        ('elder@test.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), '{"provider":"email","providers":["email"]}')
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO auth_uid_elder;
    
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data)
    VALUES 
        ('blood@test.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345', NOW(), '{"provider":"email","providers":["email"]}')
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO auth_uid_blood;
    
    -- Create app users if they don't exist
    INSERT INTO public.users (auth_user_id, username, email, tier, coins)
    VALUES 
        (auth_uid_grassroot, 'GrassrootFan', 'grassroot@test.com', 'grassroot', 100)
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO user_id_grassroot;
    
    INSERT INTO public.users (auth_user_id, username, email, tier, coins)
    VALUES 
        (auth_uid_pioneer, 'PioneerFan', 'pioneer@test.com', 'pioneer', 500)
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO user_id_pioneer;
    
    INSERT INTO public.users (auth_user_id, username, email, tier, coins)
    VALUES 
        (auth_uid_elder, 'ElderFan', 'elder@test.com', 'elder', 1000)
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO user_id_elder;
    
    INSERT INTO public.users (auth_user_id, username, email, tier, coins)
    VALUES 
        (auth_uid_blood, 'BloodFan', 'blood@test.com', 'blood', 2000)
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO user_id_blood;
    
    -- Create some sample posts
    -- Grassroot user post
    INSERT INTO public.community_posts (user_id, title, content, category)
    VALUES 
        (user_id_grassroot, 'Just discovered Erigga!', 'I just discovered Erigga''s music and I''m blown away! Which album should I listen to first?', 'general-discussion');
    
    -- Pioneer user post
    INSERT INTO public.community_posts (user_id, title, content, category)
    VALUES 
        (user_id_pioneer, 'Lyrics breakdown: "The Erigma"', 'Let''s discuss the deeper meaning behind the lyrics in "The Erigma". I think there are some hidden messages that we should explore.', 'music-lyrics');
    
    -- Elder user post
    INSERT INTO public.community_posts (user_id, title, content, category)
    VALUES 
        (user_id_elder, 'Upcoming show in Lagos', 'Who''s going to the upcoming show in Lagos? I heard there might be some special guests!', 'events-shows');
    
    -- Blood user post
    INSERT INTO public.community_posts (user_id, title, content, category, is_pinned)
    VALUES 
        (user_id_blood, 'Exclusive: New album hints', 'As a Blood tier member, I got some exclusive hints about the upcoming album. It''s going to be revolutionary!', 'blood-brotherhood', true);
    
    -- Add some comments
    INSERT INTO public.community_comments (post_id, user_id, content)
    VALUES 
        (1, user_id_pioneer, 'Start with "The Erigma II" - it''s a masterpiece!');
    
    INSERT INTO public.community_comments (post_id, user_id, content)
    VALUES 
        (1, user_id_elder, 'Welcome to the community! You''re in for a treat with Erigga''s music.');
    
    INSERT INTO public.community_comments (post_id, user_id, content)
    VALUES 
        (2, user_id_blood, 'The wordplay in that track is incredible. Notice how he uses double entendres throughout.');
    
    INSERT INTO public.community_comments (post_id, user_id, content)
    VALUES 
        (3, user_id_grassroot, 'I wish I could go! Please share photos if you attend.');
    
    -- Add some votes
    INSERT INTO public.community_post_votes (post_id, user_id, vote_type)
    VALUES 
        (1, user_id_pioneer, 'upvote'),
        (1, user_id_elder, 'upvote'),
        (2, user_id_grassroot, 'upvote'),
        (2, user_id_blood, 'upvote'),
        (3, user_id_pioneer, 'upvote'),
        (4, user_id_elder, 'upvote');
    
    -- Add some coin votes
    INSERT INTO public.community_post_votes (post_id, user_id, vote_type, coins_spent)
    VALUES 
        (4, user_id_blood, 'coin', 50);
    
    -- Update vote counts
    UPDATE public.community_posts
    SET upvotes = 2
    WHERE id = 1;
    
    UPDATE public.community_posts
    SET upvotes = 2
    WHERE id = 2;
    
    UPDATE public.community_posts
    SET upvotes = 1
    WHERE id = 3;
    
    UPDATE public.community_posts
    SET upvotes = 1, coin_votes = 50
    WHERE id = 4;
    
    -- Update comment counts
    UPDATE public.community_posts
    SET comment_count = 2
    WHERE id = 1;
    
    UPDATE public.community_posts
    SET comment_count = 1
    WHERE id = 2;
    
    UPDATE public.community_posts
    SET comment_count = 1
    WHERE id = 3;
END $$;
