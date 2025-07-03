-- Create test users with proper UUID handling
-- This script creates sample users and data for testing

DO $$
DECLARE
    test_user_1_id UUID;
    test_user_2_id UUID;
    test_user_3_id UUID;
    test_post_1_id BIGINT;
    test_post_2_id BIGINT;
    test_post_3_id BIGINT;
    test_post_4_id BIGINT;
BEGIN
    -- Generate UUIDs for test users
    test_user_1_id := gen_random_uuid();
    test_user_2_id := gen_random_uuid();
    test_user_3_id := gen_random_uuid();
    
    -- Insert test users directly (for testing purposes)
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
        test_user_1_id, -- Using same UUID for auth_user_id in test
        'eriggaofficial',
        'Erigga Official',
        'erigga@official.com',
        '/placeholder-user.jpg',
        'The Paper Boi himself. Welcome to my community! 🎵',
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
        'Representing Warri to the fullest. Erigga fan since day one! 🔥',
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
        'Love good music, especially Erigga''s bars! 🎧',
        'grassroot',
        2000,
        1000
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        bio = EXCLUDED.bio,
        tier = EXCLUDED.tier,
        coins = EXCLUDED.coins,
        reputation_score = EXCLUDED.reputation_score;
    
    -- Create sample posts and get their IDs
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
        'Welcome to the official Erigga community! 🎵 

This is where real music lovers gather. Share your thoughts, bars, and connect with fellow fans. Let''s build something special together! 

Drop your favorite Erigga track in the comments below! 👇

#EriggaMovement #PaperBoi #Community',
        ARRAY['EriggaMovement', 'PaperBoi', 'Community', 'Welcome'],
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

*Money dey for pocket, but the hunger still dey*
*Every single day we dey grind, no delay*
*Erigga teach us say make we no give up*
*From the bottom to the top, we go level up*

What y''all think? Drop your bars below! 🎤

#Freestyle #EriggaBars #Warri #PaperBoiVibes',
        ARRAY['Freestyle', 'EriggaBars', 'Warri', 'PaperBoiVibes'],
        18,
        89
    ),
    (
        test_user_3_id,
        2, -- Music & Lyrics
        'Can we talk about how deep "The Erigma" album is? 🎧 

Every track tells a story, every bar hits different. My favorite has to be "Motivation" - that song changed my perspective on life. The way he talks about struggle, success, and staying true to yourself... man, that''s real music right there.

"A Tribute to My Ex" also hits different when you really listen to the lyrics. The storytelling is incredible.

What''s your favorite Erigga track and why? Let''s discuss! 💭

#TheErigma #Motivation #DeepLyrics #RealMusic',
        ARRAY['TheErigma', 'Motivation', 'DeepLyrics', 'RealMusic'],
        12,
        67
    ),
    (
        test_user_1_id,
        3, -- Events & Shows
        'Big announcement coming soon! 📢 

Can''t say much yet, but something special is in the works for all my fans. Been working on this for months and I know y''all going to love it.

Stay tuned and keep supporting real music! Your support means everything to me. 🙏

Hint: It involves the community and some exclusive content... 👀

#ComingSoon #BigNews #Announcement #ExclusiveContent',
        ARRAY['ComingSoon', 'BigNews', 'Announcement', 'ExclusiveContent'],
        45,
        234
    )
    RETURNING id INTO test_post_1_id, test_post_2_id, test_post_3_id, test_post_4_id;
    
    -- Get the actual post IDs (since RETURNING only gets the last one)
    SELECT id INTO test_post_1_id FROM public.community_posts WHERE user_id = test_user_1_id AND content LIKE 'Welcome to the official%' LIMIT 1;
    SELECT id INTO test_post_2_id FROM public.community_posts WHERE user_id = test_user_2_id AND content LIKE 'Just dropped some fire%' LIMIT 1;
    SELECT id INTO test_post_3_id FROM public.community_posts WHERE user_id = test_user_3_id AND content LIKE 'Can we talk about%' LIMIT 1;
    SELECT id INTO test_post_4_id FROM public.community_posts WHERE user_id = test_user_1_id AND content LIKE 'Big announcement%' LIMIT 1;
    
    -- Create sample comments
    INSERT INTO public.community_comments (
        post_id,
        user_id,
        content
    ) VALUES 
    (test_post_1_id, test_user_2_id, 'First! 🔥 So excited for this community! This is going to be legendary!'),
    (test_post_1_id, test_user_3_id, 'This is going to be amazing! Thanks for creating this space for us fans. My favorite track is definitely "Motivation"!'),
    (test_post_2_id, test_user_1_id, 'Those bars are fire! 🔥 Keep pushing the culture forward! The Warri spirit is strong in this one!'),
    (test_post_2_id, test_user_3_id, 'Yo this is sick! The flow reminds me of "Paper Boi" vibes. You got talent bro!'),
    (test_post_3_id, test_user_1_id, 'Appreciate the love for "The Erigma"! That album was straight from the heart. "Motivation" is special to me too.'),
    (test_post_3_id, test_user_2_id, 'Facts! "Motivation" is a masterpiece. That song got me through tough times. Real recognize real!'),
    (test_post_4_id, test_user_2_id, 'Can''t wait! Whatever it is, we''re ready! 🙌 The community is behind you 100%!'),
    (test_post_4_id, test_user_3_id, 'The suspense is killing me! 😅 But I know it''s going to be worth the wait!')
    ON CONFLICT DO NOTHING;
    
    -- Create sample votes
    INSERT INTO public.community_post_votes (post_id, user_id) VALUES 
    (test_post_1_id, test_user_2_id),
    (test_post_1_id, test_user_3_id),
    (test_post_2_id, test_user_1_id),
    (test_post_2_id, test_user_3_id),
    (test_post_3_id, test_user_1_id),
    (test_post_3_id, test_user_2_id),
    (test_post_4_id, test_user_2_id),
    (test_post_4_id, test_user_3_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
    
    -- Create sample follows
    INSERT INTO public.user_follows (follower_id, following_id) VALUES 
    (test_user_2_id, test_user_1_id),
    (test_user_3_id, test_user_1_id),
    (test_user_3_id, test_user_2_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
    
    -- Create some sample coin transactions
    INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description) VALUES
    (test_user_1_id, 1000, 'reward', 'Welcome bonus'),
    (test_user_2_id, 500, 'reward', 'First post bonus'),
    (test_user_3_id, 200, 'reward', 'Community engagement'),
    (test_user_2_id, -100, 'vote', 'Voted on post'),
    (test_user_3_id, -100, 'vote', 'Voted on post')
    ON CONFLICT DO NOTHING;
    
    -- Update post counts to match actual data
    UPDATE public.community_posts 
    SET vote_count = (SELECT COUNT(*) FROM public.community_post_votes WHERE post_id = public.community_posts.id),
        comment_count = (SELECT COUNT(*) FROM public.community_comments WHERE post_id = public.community_posts.id)
    WHERE id IN (test_post_1_id, test_post_2_id, test_post_3_id, test_post_4_id);
    
    -- Update user stats
    UPDATE public.users 
    SET posts_count = (SELECT COUNT(*) FROM public.community_posts WHERE user_id = public.users.id),
        followers_count = (SELECT COUNT(*) FROM public.user_follows WHERE following_id = public.users.id),
        following_count = (SELECT COUNT(*) FROM public.user_follows WHERE follower_id = public.users.id)
    WHERE id IN (test_user_1_id, test_user_2_id, test_user_3_id);
    
    RAISE NOTICE '=== TEST DATA CREATED SUCCESSFULLY ===';
    RAISE NOTICE 'Users created: %', (SELECT COUNT(*) FROM public.users);
    RAISE NOTICE 'Posts created: %', (SELECT COUNT(*) FROM public.community_posts);
    RAISE NOTICE 'Comments created: %', (SELECT COUNT(*) FROM public.community_comments);
    RAISE NOTICE 'Votes created: %', (SELECT COUNT(*) FROM public.community_post_votes);
    RAISE NOTICE 'Follows created: %', (SELECT COUNT(*) FROM public.user_follows);
    RAISE NOTICE 'Transactions created: %', (SELECT COUNT(*) FROM public.coin_transactions);
    RAISE NOTICE '=== READY FOR COMMUNITY TESTING ===';
    
    -- Show test user info
    RAISE NOTICE 'Test Users:';
    RAISE NOTICE '- eriggaofficial (Blood tier, % coins)', (SELECT coins FROM public.users WHERE username = 'eriggaofficial');
    RAISE NOTICE '- warriking (Pioneer tier, % coins)', (SELECT coins FROM public.users WHERE username = 'warriking');
    RAISE NOTICE '- naijafan (Grassroot tier, % coins)', (SELECT coins FROM public.users WHERE username = 'naijafan');
    
END $$;
