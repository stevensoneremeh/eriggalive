-- First, update the chat_rooms tier constraint to allow new values
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_tier_check;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_tier_check 
    CHECK (tier IN ('Grassroot', 'Pioneer', 'Elder', 'Blood', 'Global', 'General', 'Freebies'));

-- Add General and Freebies chat rooms
INSERT INTO public.chat_rooms (name, description, is_private, tier) VALUES
('General', 'Public chat room for all community members', false, 'General'),
('Freebies', 'Share and vote on freebies, giveaways, and community content', false, 'Freebies')
ON CONFLICT (name) DO NOTHING;

-- Create freebies_posts table
CREATE TABLE IF NOT EXISTS public.freebies_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create freebies_votes table
CREATE TABLE IF NOT EXISTS public.freebies_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.freebies_posts(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Create freebies_likes table
CREATE TABLE IF NOT EXISTS public.freebies_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.freebies_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Create freebies_comments table
CREATE TABLE IF NOT EXISTS public.freebies_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.freebies_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.freebies_comments(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
