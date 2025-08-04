-- Complete authentication setup with auto-confirmation and profile creation

-- Ensure all required types exist
DO $$ 
BEGIN
    -- Create user_tier enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
        CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
        RAISE NOTICE 'Created user_tier enum';
    END IF;

    -- Create user_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
        RAISE NOTICE 'Created user_role enum';
    END IF;
END $$;

-- Ensure the users table has all required columns with proper defaults
ALTER TABLE public.users 
    ALTER COLUMN full_name DROP NOT NULL,
    ALTER COLUMN email_verified SET DEFAULT true,
    ALTER COLUMN phone_verified SET DEFAULT false,
    ALTER COLUMN two_factor_enabled SET DEFAULT false,
    ALTER COLUMN login_count SET DEFAULT 0,
    ALTER COLUMN preferences SET DEFAULT '{}',
    ALTER COLUMN metadata SET DEFAULT '{}',
    ALTER COLUMN tier SET DEFAULT 'grassroot',
    ALTER COLUMN role SET DEFAULT 'user',
    ALTER COLUMN level SET DEFAULT 1,
    ALTER COLUMN points SET DEFAULT 0,
    ALTER COLUMN coins SET DEFAULT 500,
    ALTER COLUMN is_verified SET DEFAULT false,
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN is_banned SET DEFAULT false;

-- Create function to handle new user registration with auto-confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_username text;
BEGIN
    -- Generate a unique username from email
    new_username := split_part(NEW.email, '@', 1);
    
    -- Ensure username is unique by appending numbers if needed
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
        new_username := split_part(NEW.email, '@', 1) || '_' || floor(random() * 1000)::text;
    END LOOP;

    -- Insert new user profile
    INSERT INTO public.users (
        auth_user_id,
        username,
        full_name,
        email,
        email_verified,
        phone_verified,
        tier,
        role,
        level,
        points,
        coins,
        is_verified,
        is_active,
        is_banned,
        two_factor_enabled,
        login_count,
        preferences,
        metadata,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        new_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        true, -- Auto-confirm email
        false,
        'grassroot',
        'user',
        1,
        0,
        500, -- Starting coins
        false,
        true,
        false,
        false,
        1,
        '{}',
        '{}',
        NOW(),
        NOW()
    );

    -- Auto-confirm the user in auth.users
    UPDATE auth.users 
    SET 
        email_confirmed_at = NOW(),
        confirmed_at = NOW()
    WHERE id = NEW.id;

    RAISE NOTICE 'Created user profile for: %', NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to auto-confirm existing unconfirmed users
CREATE OR REPLACE FUNCTION public.auto_confirm_users()
RETURNS void AS $$
BEGIN
    -- Auto-confirm all unconfirmed users
    UPDATE auth.users 
    SET 
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at = COALESCE(confirmed_at, NOW())
    WHERE email_confirmed_at IS NULL OR confirmed_at IS NULL;
    
    RAISE NOTICE 'Auto-confirmed all existing users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the auto-confirm function
SELECT public.auto_confirm_users();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Public profiles are viewable by everyone" ON public.users
    FOR SELECT USING (is_active = true AND is_banned = false);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active, is_banned);

RAISE NOTICE 'Authentication setup completed successfully';
