-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood', 'mod', 'admin');
CREATE TYPE room_type AS ENUM ('general', 'tier_based', 'private');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  tier user_tier DEFAULT 'grassroot',
  coins INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts table
CREATE TABLE public.community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post votes table
CREATE TABLE public.post_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE public.post_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  room_type room_type DEFAULT 'general',
  required_tier user_tier DEFAULT 'grassroot',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat message votes table
CREATE TABLE public.chat_message_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Coin transactions table
CREATE TABLE public.coin_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content uploads table
CREATE TABLE public.content_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  price INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default chat rooms
INSERT INTO public.chat_rooms (name, description, room_type, required_tier) VALUES
('General Chat', 'Open discussion for all members', 'general', 'grassroot'),
('Freebies', 'Share and request free content', 'general', 'grassroot'),
('Pioneer Lounge', 'Exclusive chat for Pioneer tier and above', 'tier_based', 'pioneer'),
('Elder Council', 'Private discussions for Elder tier and above', 'tier_based', 'elder'),
('Blood Brotherhood', 'Elite chat for Blood tier members only', 'tier_based', 'blood');

-- Create indexes for better performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_tier ON public.users(tier);
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_post_votes_post_id ON public.post_votes(post_id);
CREATE INDEX idx_post_votes_user_id ON public.post_votes(user_id);
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_message_votes_message_id ON public.chat_message_votes(message_id);

-- Functions to update vote counts
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.community_posts 
    SET 
      upvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = 1),
      downvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = NEW.post_id AND vote_type = -1),
      updated_at = NOW()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET 
      upvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = OLD.post_id AND vote_type = 1),
      downvotes = (SELECT COUNT(*) FROM public.post_votes WHERE post_id = OLD.post_id AND vote_type = -1),
      updated_at = NOW()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_message_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.chat_messages 
    SET 
      upvotes = (SELECT COUNT(*) FROM public.chat_message_votes WHERE message_id = NEW.message_id AND vote_type = 1),
      downvotes = (SELECT COUNT(*) FROM public.chat_message_votes WHERE message_id = NEW.message_id AND vote_type = -1),
      updated_at = NOW()
    WHERE id = NEW.message_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.chat_messages 
    SET 
      upvotes = (SELECT COUNT(*) FROM public.chat_message_votes WHERE message_id = OLD.message_id AND vote_type = 1),
      downvotes = (SELECT COUNT(*) FROM public.chat_message_votes WHERE message_id = OLD.message_id AND vote_type = -1),
      updated_at = NOW()
    WHERE id = OLD.message_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_post_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.post_votes
  FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

CREATE TRIGGER trigger_update_message_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.chat_message_votes
  FOR EACH ROW EXECUTE FUNCTION update_message_vote_counts();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_uploads ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Community posts policies
CREATE POLICY "Anyone can view posts" ON public.community_posts FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- Post votes policies
CREATE POLICY "Anyone can view votes" ON public.post_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.post_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.post_votes FOR DELETE USING (auth.uid() = user_id);

-- Chat rooms policies
CREATE POLICY "Anyone can view active rooms" ON public.chat_rooms FOR SELECT USING (is_active = true);

-- Chat messages policies
CREATE POLICY "Anyone can view messages" ON public.chat_messages FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Authenticated users can create messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);

-- Chat message votes policies
CREATE POLICY "Anyone can view message votes" ON public.chat_message_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote on messages" ON public.chat_message_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own message votes" ON public.chat_message_votes FOR UPDATE USING (auth.uid() = user_id);

-- Coin transactions policies
CREATE POLICY "Users can view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create transactions" ON public.coin_transactions FOR INSERT WITH CHECK (true);

-- Content uploads policies
CREATE POLICY "Anyone can view approved content" ON public.content_uploads FOR SELECT USING (is_approved = true AND is_active = true);
CREATE POLICY "Users can create uploads" ON public.content_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own uploads" ON public.content_uploads FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Storage policies
CREATE POLICY "Anyone can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
