-- Insert community categories if they don't exist
INSERT INTO community_categories (name, slug, description, is_active, display_order) 
VALUES 
  ('Bars', 'bars', 'Share your favorite bars and lyrics', true, 1),
  ('Stories', 'stories', 'Tell your stories and experiences', true, 2),
  ('Events', 'events', 'Upcoming events and announcements', true, 3),
  ('General', 'general', 'General discussions and conversations', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert some dummy posts with realistic content
WITH category_ids AS (
  SELECT id, slug FROM community_categories WHERE slug IN ('bars', 'stories', 'events', 'general')
),
user_data AS (
  SELECT id, username FROM users LIMIT 5
)
INSERT INTO community_posts (
  user_id, 
  category_id, 
  content, 
  vote_count, 
  comment_count,
  is_published,
  created_at,
  updated_at
)
SELECT 
  u.id,
  c.id,
  CASE 
    WHEN c.slug = 'bars' THEN 
      '<p>🔥 Just dropped this fire bar:</p><blockquote><p><em>"Money dey but e no dey show for face<br/>Hustle hard, make the struggle no waste<br/>From Warri to Lagos, we dey chase the case<br/>Erigga on the mic, putting haters in their place"</em></p></blockquote><p>What y''all think about this one? 💯</p>'
    WHEN c.slug = 'stories' THEN 
      '<p>Real talk, growing up in Warri wasn''t easy but it shaped who I am today. 💪</p><p>Remember those days when we had to hustle just to eat? Now look at us! The journey continues...</p><p>Shoutout to everyone still grinding. Your time go come! 🙏</p>'
    WHEN c.slug = 'events' THEN 
      '<p>🎤 <strong>UPCOMING SHOW ALERT!</strong> 🎤</p><p>December 15th at Eko Hotel, Lagos! Who''s pulling up? 🔥</p><p>Special guests, surprise performances, and pure vibes guaranteed! 🎵</p><p>Tickets available now. Link in bio! 🎫</p>'
    ELSE 
      '<p>Good morning fam! ☀️</p><p>Just wanted to check in and see how everyone is doing. Remember to stay positive and keep pushing forward.</p><p>What''s one thing you''re grateful for today? Drop it in the comments! 👇</p>'
  END,
  FLOOR(RANDOM() * 50) + 5, -- Random vote count between 5-55
  FLOOR(RANDOM() * 20) + 1, -- Random comment count between 1-21
  true,
  NOW() - (RANDOM() * INTERVAL '7 days'), -- Random time within last 7 days
  NOW() - (RANDOM() * INTERVAL '7 days')
FROM user_data u
CROSS JOIN category_ids c
WHERE NOT EXISTS (
  SELECT 1 FROM community_posts 
  WHERE user_id = u.id AND category_id = c.id
)
LIMIT 12; -- Create 12 dummy posts

-- Add some posts with media URLs (simulated)
UPDATE community_posts 
SET 
  media_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
  media_type = 'image',
  media_metadata = '{"name": "studio_session.jpg", "size": 245760, "type": "image/jpeg"}'
WHERE id IN (
  SELECT id FROM community_posts 
  WHERE content LIKE '%fire bar%' 
  LIMIT 1
);

UPDATE community_posts 
SET 
  media_url = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
  media_type = 'image',
  media_metadata = '{"name": "warri_streets.jpg", "size": 189432, "type": "image/jpeg"}'
WHERE id IN (
  SELECT id FROM community_posts 
  WHERE content LIKE '%Warri%' 
  LIMIT 1
);

-- Add some mentions to posts
UPDATE community_posts 
SET content = REPLACE(
  content, 
  'Shoutout to everyone', 
  'Shoutout to @' || (SELECT username FROM users WHERE id != community_posts.user_id LIMIT 1) || ' and everyone'
)
WHERE content LIKE '%Shoutout to everyone%';
