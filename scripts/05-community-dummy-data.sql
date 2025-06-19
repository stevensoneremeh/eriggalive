-- Insert dummy posts to make the community look active
INSERT INTO community_posts (user_id, category_id, content, vote_count, is_published, is_deleted, created_at) VALUES
(1, 1, 'Just dropped some fire bars! 🔥 Check out my latest freestyle session. The energy was unreal!', 15, true, false, NOW() - INTERVAL '2 hours'),
(2, 2, 'Remember when Erigga first started? His journey from the streets to stardom is truly inspiring. What''s your favorite Erigga track of all time?', 8, true, false, NOW() - INTERVAL '4 hours'),
(3, 3, 'Who''s going to the Lagos show next month? I''ve got my tickets and I''m so hyped! 🎤🎵', 12, true, false, NOW() - INTERVAL '6 hours'),
(1, 4, 'Good morning Erigga family! Hope everyone is having a blessed day. Remember to stay focused on your goals! 💪', 5, true, false, NOW() - INTERVAL '8 hours'),
(2, 1, 'Working on some new material. The studio sessions have been crazy productive lately. Can''t wait to share what we''ve been cooking! 🎵', 20, true, false, NOW() - INTERVAL '12 hours'),
(3, 2, 'That time Erigga performed at my university was legendary! The crowd went absolutely wild. Still gives me chills thinking about it.', 7, true, false, NOW() - INTERVAL '1 day'),
(1, 3, 'Concert announcement coming soon! Keep your eyes peeled for something special. It''s going to be epic! 👀', 25, true, false, NOW() - INTERVAL '1 day 2 hours'),
(2, 4, 'Shoutout to all the real fans who''ve been supporting from day one. Your energy keeps us going! Much love ❤️', 18, true, false, NOW() - INTERVAL '1 day 4 hours'),
(3, 1, 'Just finished a crazy freestyle session with the crew. The bars were flowing like water! Who wants to hear it?', 11, true, false, NOW() - INTERVAL '1 day 8 hours'),
(1, 2, 'Throwback to that iconic music video shoot. Behind the scenes was even more fun than what you saw! 📸', 9, true, false, NOW() - INTERVAL '2 days');

-- Add some votes to make posts look active
INSERT INTO community_post_votes (post_id, user_id) VALUES
(1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 3), (2, 4),
(3, 1), (3, 2), (3, 5),
(4, 2), (4, 3),
(5, 1), (5, 3), (5, 4), (5, 5),
(6, 1), (6, 2),
(7, 2), (7, 3), (7, 4),
(8, 1), (8, 3), (8, 5),
(9, 2), (9, 4),
(10, 1), (10, 3);
