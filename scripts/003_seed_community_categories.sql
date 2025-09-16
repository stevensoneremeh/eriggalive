-- Seed community categories with proper data

INSERT INTO community_categories (name, slug, description, color, icon, display_order, is_active) VALUES
  ('General Discussion', 'general', 'General conversations about Erigga and music', '#3B82F6', 'users', 1, true),
  ('Music Talk', 'music', 'Discuss Erigga''s music, lyrics, and releases', '#10B981', 'music', 2, true),
  ('Videos & Media', 'videos', 'Share and discuss music videos and media content', '#F59E0B', 'video', 3, true),
  ('Fan Art & Creativity', 'fanart', 'Share your creative works and fan art', '#8B5CF6', 'image', 4, true),
  ('Events & News', 'events', 'Latest news, events, and announcements', '#EF4444', 'trending', 5, true),
  ('Support & Help', 'support', 'Get help and support from the community', '#6B7280', 'hash', 6, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;
