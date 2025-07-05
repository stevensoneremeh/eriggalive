-- Create the users table that the auth context expects
CREATE TABLE IF NOT EXISTS public.users (
    id bigint primary key generated always as identity,
    auth_user_id uuid unique not null,
    username text unique not null check (length(username) >= 3 and length(username) <= 30),
    full_name text not null check (length(full_name) >= 2),
    email text unique not null,
    avatar_url text,
    cover_image_url text,
    tier text default 'grassroot' check (tier in ('grassroot', 'pioneer', 'blood', 'elder', 'mod', 'admin')),
    role text default 'user' check (role in ('user', 'mod', 'admin')),
    level integer default 1 check (level >= 1 and level <= 100),
    points integer default 0 check (points >= 0),
    coins integer default 0 check (coins >= 0),
    erigga_id text unique,
    bio text check (length(bio) <= 500),
    location text,
    wallet_address text,
    phone_number text,
    date_of_birth date,
    gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
    is_verified boolean default false,
    is_active boolean default true,
    is_banned boolean default false,
    ban_reason text,
    banned_until timestamp with time zone,
    last_login timestamp with time zone,
    login_count integer default 0,
    referral_code text unique,
    referred_by bigint references public.users(id),
    subscription_expires_at timestamp with time zone,
    email_verified boolean default false,
    phone_verified boolean default false,
    two_factor_enabled boolean default false,
    two_factor_secret text,
    preferences jsonb default '{}',
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Public profiles are viewable by everyone" ON public.users
    FOR SELECT USING (is_active = true);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, username, full_name, tier, coins)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'tier', 'grassroot'),
        CASE 
            WHEN COALESCE(NEW.raw_user_meta_data->>'tier', 'grassroot') = 'grassroot' THEN 100
            WHEN COALESCE(NEW.raw_user_meta_data->>'tier', 'grassroot') = 'pioneer' THEN 500
            ELSE 1000
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
