-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix users table if it doesn't exist or has wrong structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE public.users (
            id SERIAL PRIMARY KEY,
            auth_user_id UUID NOT NULL UNIQUE,
            username VARCHAR(255) NOT NULL UNIQUE,
            full_name VARCHAR(255),
            email VARCHAR(255) NOT NULL,
            avatar_url TEXT,
            tier VARCHAR(50) DEFAULT 'grassroot',
            coins_balance INTEGER DEFAULT 100,
            level INTEGER DEFAULT 1,
            points INTEGER DEFAULT 0,
            role VARCHAR(50) DEFAULT 'user',
            is_active BOOLEAN DEFAULT TRUE,
            is_verified BOOLEAN DEFAULT FALSE,
            is_banned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_user_id') THEN
            ALTER TABLE public.users ADD COLUMN auth_user_id UUID UNIQUE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier') THEN
            ALTER TABLE public.users ADD COLUMN tier VARCHAR(50) DEFAULT 'grassroot';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins_balance') THEN
            ALTER TABLE public.users ADD COLUMN coins_balance INTEGER DEFAULT 100;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
            ALTER TABLE public.users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        END IF;
    END IF;
END
$$;

-- Fix community_categories table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_categories') THEN
        CREATE TABLE public.community_categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default categories
        INSERT INTO public.community_categories (name, description) VALUES
            ('General', 'General discussions about Erigga'),
            ('Music', 'Discussions about Erigga''s music'),
            ('Events', 'Upcoming events and concerts'),
            ('Collaborations', 'Erigga''s collaborations with other artists'),
            ('Lyrics', 'Discussions about song lyrics');
    END IF;
END
$$;

-- Fix community_posts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_posts') THEN
        CREATE TABLE public.community_posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            user_id UUID NOT NULL,
            category_id INTEGER REFERENCES public.community_categories(id),
            upvotes INTEGER DEFAULT 0,
            downvotes INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'upvotes') THEN
            ALTER TABLE public.community_posts ADD COLUMN upvotes INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'downvotes') THEN
            ALTER TABLE public.community_posts ADD COLUMN downvotes INTEGER DEFAULT 0;
        END IF;
    END IF;
END
$$;

-- Fix community_comments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_comments') THEN
        CREATE TABLE public.community_comments (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            user_id UUID NOT NULL,
            post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE,
            parent_id INTEGER REFERENCES public.community_comments(id) ON DELETE CASCADE,
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Fix community_votes table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_votes') THEN
        CREATE TABLE public.community_votes (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE,
            vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, post_id)
        );
    END IF;
END
$$;

-- Fix community_comment_likes table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_comment_likes') THEN
        CREATE TABLE public.community_comment_likes (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            comment_id INTEGER REFERENCES public.community_comments(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, comment_id)
        );
    END IF;
END
$$;

-- Create video_calls table for meet & greet functionality
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_calls') THEN
        CREATE TABLE public.video_calls (
            id SERIAL PRIMARY KEY,
            room_name VARCHAR(255) NOT NULL UNIQUE,
            host_id UUID NOT NULL,
            status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
            scheduled_start TIMESTAMP WITH TIME ZONE,
            scheduled_end TIMESTAMP WITH TIME ZONE,
            actual_start TIMESTAMP WITH TIME ZONE,
            actual_end TIMESTAMP WITH TIME ZONE,
            max_participants INTEGER DEFAULT 10,
            tier_access VARCHAR(50) DEFAULT 'blood',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Create video_call_participants table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_call_participants') THEN
        CREATE TABLE public.video_call_participants (
            id SERIAL PRIMARY KEY,
            call_id INTEGER REFERENCES public.video_calls(id) ON DELETE CASCADE,
            user_id UUID NOT NULL,
            join_time TIMESTAMP WITH TIME ZONE,
            leave_time TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(call_id, user_id)
        );
    END IF;
END
$$;

-- Create RLS policies for users table
DO $$
BEGIN
    -- Enable RLS on users table
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Admins can do everything" ON public.users;
    
    -- Create policies
    CREATE POLICY "Users can view all profiles" 
        ON public.users FOR SELECT 
        USING (true);
        
    CREATE POLICY "Users can update own profile" 
        ON public.users FOR UPDATE 
        USING (auth.uid() = auth_user_id);
        
    CREATE POLICY "Admins can do everything" 
        ON public.users 
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE auth_user_id = auth.uid() 
                AND role = 'admin'
            )
        );
END
$$;

-- Create RLS policies for community tables
DO $$
BEGIN
    -- Enable RLS on community tables
    ALTER TABLE
