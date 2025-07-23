-- Fix community schema issues
-- Run this script in your Supabase SQL editor

-- First, let's check what exists and fix the schema
DO $$
BEGIN
    -- Add missing columns to community_posts if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'vote_count') THEN
        ALTER TABLE public.community_posts ADD COLUMN vote_count INTEGER DEFAULT 0 CHECK (vote_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'comment_count') THEN
        ALTER TABLE public.community_posts ADD COLUMN comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'view_count') THEN
        ALTER TABLE public.community_posts ADD COLUMN view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'hashtags') THEN
        ALTER TABLE public.community_posts ADD COLUMN hashtags TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'mentions') THEN
        ALTER TABLE public.community_posts ADD COLUMN mentions UUID[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'media_url') THEN
        ALTER TABLE public.community_posts ADD COLUMN media_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'media_type') THEN
        ALTER TABLE public.community_posts ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video', 'audio'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'is_pinned') THEN
        ALTER TABLE public.community_posts ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'is_featured') THEN
        ALTER TABLE public.community_posts ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'is_published') THEN
        ALTER TABLE public.community_posts ADD COLUMN is_published BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'is_deleted') THEN
        ALTER TABLE public.community_posts ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Fix users table to use UUID for id (matching auth.users)
DO $$
BEGIN
    -- Check if users table exists and has the right structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Check if id column is UUID
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'uuid') THEN
            -- Drop and recreate users table with correct structure
            DROP TABLE IF EXISTS public.users CASCADE;
            
            CREATE TABLE public.users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                auth_user_id UUID UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 30),
                full_name TEXT NOT NULL CHECK (length(full_name) >= 2),
                email TEXT NOT NULL,
                avatar_url TEXT,
                bio TEXT CHECK (length(bio) <= 500),
                location TEXT,
                tier TEXT DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
                level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
                points INTEGER DEFAULT 0 CHECK (points >= 0),
                coins BIGINT DEFAULT 1000 CHECK (coins >= 0),
                reputation_score INTEGER DEFAULT 0,
                posts_count INTEGER DEFAULT 0 CHECK (posts_count >= 0),
                followers_count INTEGER DEFAULT 0 CHECK (followers_count >= 0),
                following_count INTEGER DEFAULT 0 CHECK (following_count >= 0),
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Enable RLS
            ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
            
            -- Create policies
            CREATE POLICY "Users can view all profiles" ON public.users
                FOR SELECT USING (true);
            
            CREATE POLICY "Users can update own profile" ON public.users
                FOR UPDATE USING (auth.uid() = auth_user_id);
        END IF;
    END IF;
END $$;

-- Fix community_posts foreign key to reference users.id (UUID)
DO $$
BEGIN
    -- Drop existing foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'community_posts_user_id_fkey') THEN
        ALTER TABLE public.community_posts DROP CONSTRAINT community_posts_user_id_fkey;
    END IF;
    
    -- Change user_id column to UUID if it's not already
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'community_posts' AND column_name = 'user_id' AND data_type != 'uuid') THEN
        ALTER TABLE public.community_posts ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
    END IF;
    
    -- Add the foreign key constraint back
    ALTER TABLE public.community_posts 
    ADD CONSTRAINT community_posts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
END $$;

-- Insert sample test users with proper UUIDs
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
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
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
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
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
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    'naijafan',
    'Naija Music Fan',
    'naija@fan.com',
    '/placeholder-user.jpg',
    'Love good music, especially Erigga''s bars! 🎧',
    'grassroot',
    2000,
    1000
)
ON CONFLICT (username) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    bio = EXCLUDED.bio,
    tier = EXCLUDED.tier,
    coins = EXCLUDED.coins,
    reputation_score = EXCLUDED.reputation_score;

-- Create sample posts with proper user references
INSERT INTO public.community_posts (
    user_id,
    category_id,
    content,
    hashtags,
    vote_count,
    view_count,
    comment_count
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    1,
    'Welcome to the official Erigga community! 🎵 

This is where real music lovers gather. Share your thoughts, bars, and connect with fellow fans. Let''s build something special together! 

Drop your favorite Erigga track in the comments below! 👇

#EriggaMovement #PaperBoi #Community',
    ARRAY['EriggaMovement', 'PaperBoi', 'Community', 'Welcome'],
    25,
    150,
    8
),
(
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    2,
    'Just listened to "The Erigma II" again and I''m still blown away! 🔥

Every track hits different. Erigga really outdid himself with this one. The storytelling, the wordplay, everything is just perfect.

What''s your favorite track from the album? Mine has to be "Strong Warning" 💪

#TheErigmaII #StrongWarning #EriggaMusic',
    ARRAY['TheErigmaII', 'StrongWarning', 'EriggaMusic'],
    18,
    95,
    12
),
(
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    4,
    'Trying to freestyle like Erigga but man, it''s not easy! 😅

Here''s my attempt:

"From the streets of Warri to the top of the game,
Erigga showed us how to rise through the pain,
Paper Boi mentality, never the same,
Real recognize real, that''s the name of the game"

Rate my bars! 🎤

#Freestyle #EriggaInspired #PaperBoi',
    ARRAY['Freestyle', 'EriggaInspired', 'PaperBoi'],
    12,
    67,
    5
)
ON CONFLICT DO NOTHING;

-- Update category post counts
UPDATE public.community_categories 
SET post_count = (
    SELECT COUNT(*) 
    FROM public.community_posts 
    WHERE category_id = community_categories.id 
    AND is_published = true 
    AND is_deleted = false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count ON public.community_posts(vote_count DESC);

SELECT 'Community schema fixed successfully!' as status;
