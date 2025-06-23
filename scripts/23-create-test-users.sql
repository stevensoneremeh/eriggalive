-- Create test users for the community
-- This script creates sample users that can be used for testing

-- First, let's create some auth users (these would normally be created through Supabase Auth)
-- Note: In a real environment, these would be created through the auth system

DO $$
DECLARE
    test_user_1_id UUID;
    test_user_2_id UUID;
    test_user_3_id UUID;
BEGIN
    -- Generate UUIDs for test users
    test_user_1_id := gen_random_uuid();
    test_user_2_id := gen_random_uuid();
    test_user_3_id := gen_random_uuid();
    
    -- Insert test users directly into public.users (bypassing auth for testing)
    INSERT INTO public.users (
        id,
        auth_user_id,
        username,
        full_name,
        email,
        avatar_url,
        bio,
        tier,
        coins,
        reputation_score
    ) VALUES 
    (
        test_user_1_id,
        test_user_1_id,
        'eriggaofficial',
        'Erigga Official',
        'erigga@official.com',
        '/placeholder-user.jpg',
        'The Paper Boi himself. Welcome to my community!',
        'blood',
        10000,
        5000
    ),
    (
        test_user_2_id,
        test_user_2_id,
        'warriking',
        'Warri King',
        'warri@king.com',
        '/placeholder-user.jpg',
        'Representing Warri to the fullest. Erigga fan since day one!',
        'pioneer',
        5000,
        2500
    ),
    (
        test_user_3_id,
        test_user_3_id,
        'naijafan',
        'Naija Music Fan',
        'naija@fan.com',
        '/placeholder-user.jpg',
        'Love good music, especially Erigga''s bars!',
        'grassroot',
        2000,
        1000
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    
    -- Create some sample posts
    INSERT INTO public.community_posts (
        user_id,
        category_id,
        content,
        hashtags,
        vote_count,
        view_count
    ) VALUES 
    (
        test_user_1_id,
        1, -- General Discussion
        'Welcome to the official Erigga community! 🎵 This is where real music lovers gather. Share your thoughts, bars, and connect with fellow fans. Let''s build something special together! #EriggaMovement #PaperBoi',
        ARRAY['EriggaMovement', 'PaperBoi', 'Welcome'],
        25,
        150
    ),
    (
        test_user_2_id,
        4, -- Freestyle Corner
        'Just dropped some fire bars inspired by the Paper Boi himself! 🔥

*From the streets of Warri to the top of the game*
*Erigga showed us how to hustle through the pain*
*Paper Boi flow, now we all want the same*
*Success and respect, that''s the ultimate aim*

What y''all think? Drop your bars below! #Freestyle #EriggaBars',
        ARRAY['Freestyle', 'EriggaBars', 'Warri'],
        18,
        89
    ),
    (
        test_user_3_id,
        2, -- Music & Lyrics
        'Can we talk about how deep "The Erigma" album is? 🎧 Every track tells a story, every bar hits different. My favorite has to be "Motivation" - that song changed my perspective on life. What''s your favorite Erigga track and why? #TheErigma #Motivation',
        ARRAY['TheErigma', 'Motivation', 'DeepLyrics'],
        12,
        67
    ),
    (
        test_user_1_id,
        3, -- Events & Shows
        'Big announcement coming soon! 📢 Can''t say much yet, but something special is in the works for all my fans. Stay tuned and keep supporting real music! #ComingSoon #BigNews',
        ARRAY['ComingSoon', 'BigNews', 'Announcement'],
        45,
        234
    )
    ON CONFLICT DO NOTHING;
    
    -- Create some sample comments
    INSERT INTO public.community_comments (
        post_id,
        user_id,
        content
    ) VALUES 
    (1, test_user_2_id, 'First! 🔥 So excited for this community!'),
    (1, test_user_3_id, 'This is going to be amazing! Thanks for creating this space for us fans.'),
    (2, test_user_1_id, 'Those bars are fire! 🔥 Keep pushing the culture forward!'),
    (2, test_user_3_id, 'Yo this is sick! The flow reminds me of "Paper Boi" vibes'),
    (3, test_user_2_id, 'Facts! "Motivation" is a masterpiece. That song got me through tough times.'),
    (4, test_user_2_id, 'Can''t wait! Whatever it is, we''re ready! 🙌'),
    (4, test_user_3_id, 'The suspense is killing me! 😅')
    ON CONFLICT DO NOTHING;
    
    -- Create some sample votes
    INSERT INTO public.community_post_votes (post_id, user_id) VALUES 
    (1, test_user_2_id),
    (1, test_user_3_id),
    (2, test_user_1_id),
    (2, test_user_3_id),
    (3, test_user_1_id),
    (3, test_user_2_id),
    (4, test_user_2_id),
    (4, test_user_3_id)
    ON CONFLICT DO NOTHING;
    
    -- Create some sample follows
    INSERT INTO public.user_follows (follower_id, following_id) VALUES 
    (test_user_2_id, test_user_1_id),
    (test_user_3_id, test_user_1_id),
    (test_user_3_id, test_user_2_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test users and sample data created successfully!';
    RAISE NOTICE 'Users: eriggaofficial, warriking, naijafan';
    RAISE NOTICE 'Posts: % created', (SELECT COUNT(*) FROM public.community_posts);
    RAISE NOTICE 'Comments: % created', (SELECT COUNT(*) FROM public.community_comments);
    RAISE NOTICE 'Votes: % created', (SELECT COUNT(*) FROM public.community_post_votes);
    
END $$;
