-- Additional test data for development and testing
-- Run this after the main setup script if you want more sample data

-- Add more sample users (these will be created when users sign up through auth)
-- This is just for reference - actual users are created via Supabase Auth

-- Add more community posts
INSERT INTO public.community_posts (user_id, category_id, content, post_type, vote_count, comment_count, view_count, tags, hashtags) VALUES
(1, 1, 'What''s your favorite Erigga track of all time? Mine has to be "Send Her Money" - that beat is just incredible! 🔥', 'general', 15, 8, 250, ARRAY['music', 'discussion'], ARRAY['erigga', 'sendmoney', 'favorite']),
(1, 2, 'Just dropped some new bars inspired by Paper Boi himself. Check it out and let me know what you think!', 'bars', 23, 12, 180, ARRAY['freestyle', 'bars'], ARRAY['paperboi', 'freestyle', 'newbars']),
(1, 3, 'Who''s going to the Lagos concert next month? Can''t wait to see Erigga live! 🎤', 'event', 31, 15, 320, ARRAY['concert', 'lagos'], ARRAY['concert', 'lagos', 'live']),
(1, 4, 'Been working on this freestyle for weeks. Finally ready to share with the Paper Boi family!', 'bars', 18, 6, 145, ARRAY['freestyle', 'original'], ARRAY['freestyle', 'original', 'bars'])
ON CONFLICT DO NOTHING;

-- Add sample comments
INSERT INTO public.community_comments (post_id, user_id, content, like_count) VALUES
(1, 1, 'Totally agree! "Send Her Money" is a masterpiece. The way Erigga flows on that track is unmatched.', 5),
(1, 1, 'I''m more of a "Motivation" person myself, but "Send Her Money" is definitely top 3!', 3),
(2, 1, 'Those bars are fire! 🔥 You''ve got that Erigga influence down perfectly.', 8),
(3, 1, 'I''ll be there! Already got my VIP tickets. Can''t wait!', 12),
(3, 1, 'Same here! This is going to be the concert of the year.', 7)
ON CONFLICT DO NOTHING;

-- Add sample votes
INSERT INTO public.community_post_votes (post_id, user_id) VALUES
(1, 1),
(2, 1),
(3, 1)
ON CONFLICT DO NOTHING;

-- Add sample freebies
INSERT INTO public.freebies (user_id, title, description, type, file_url, thumbnail_url, vote_count, download_count, tags) VALUES
(1, 'Erigga Type Beat - "Street Dreams"', 'Free beat inspired by Erigga''s style. Perfect for upcoming artists!', 'audio', '/placeholder-audio.mp3', '/placeholder.svg?height=300&width=300&text=Beat', 45, 123, ARRAY['beat', 'instrumental', 'free']),
(1, 'Paper Boi Wallpaper Pack', 'High-quality wallpapers featuring Erigga and Paper Boi artwork', 'image', '/placeholder-wallpaper.zip', '/placeholder.svg?height=400&width=600&text=Wallpaper', 67, 234, ARRAY['wallpaper', 'artwork', 'paperboi']),
(1, 'Erigga Lyrics Collection', 'Complete lyrics collection from The Erigma albums', 'document', '/placeholder-lyrics.pdf', '/placeholder.svg?height=400&width=300&text=Lyrics', 89, 456, ARRAY['lyrics', 'collection', 'erigma'])
ON CONFLICT DO NOTHING;

-- Add sample chat messages
INSERT INTO public.chat_messages (user_id, content, message_type) VALUES
(1, 'Welcome to the Paper Boi family! 🎉', 'text'),
(1, 'New music dropping soon! Stay tuned 👀', 'text'),
(1, 'Who''s ready for the next concert? 🎤', 'text'),
(1, 'Thanks for all the love and support! ❤️', 'text')
ON CONFLICT DO NOTHING;

-- Add sample notifications
INSERT INTO public.notifications (user_id, type, title, message, data) VALUES
(1, 'system', 'Welcome to Erigga Live!', 'Thank you for joining the Paper Boi family. Explore exclusive content and connect with other fans.', '{"welcome": true}'),
(1, 'content', 'New Album Available!', 'Paper Boi Chronicles is now live! Check out the latest tracks and exclusive content.', '{"album_id": 5}'),
(1, 'social', 'New Follower', 'You have a new follower in the community!', '{"follower_id": 2}'),
(1, 'vote', 'Your Post Got Voted!', 'Someone loved your post and voted for it! You earned 100 coins.', '{"post_id": 1, "coins_earned": 100}')
ON CONFLICT DO NOTHING;

-- Success message
SELECT '✅ TEST DATA ADDED SUCCESSFULLY' as message,
       'Additional sample data has been inserted for development and testing' as description;
