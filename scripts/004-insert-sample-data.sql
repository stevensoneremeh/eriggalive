-- Insert sample categories
INSERT INTO public.categories (name, description, color, icon) VALUES
('Music', 'Discussions about Erigga''s music, albums, and songs', '#ef4444', '🎵'),
('News', 'Latest news and updates about Erigga', '#3b82f6', '📰'),
('General', 'General discussions and fan talk', '#6366f1', '💬'),
('Events', 'Concerts, shows, and events', '#f59e0b', '🎤'),
('Collaborations', 'Discussions about features and collaborations', '#10b981', '🤝'),
('Street Culture', 'Street culture and lifestyle discussions', '#8b5cf6', '🏙️');

-- Insert sample chat room
INSERT INTO public.chat_rooms (name, description) VALUES
('General Chat', 'Main chat room for all fans');
