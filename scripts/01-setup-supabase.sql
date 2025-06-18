-- First, enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Set up storage for media files (idempotent)
INSERT INTO storage.buckets (id, name, public) VALUES
('avatars', 'avatars', true),
('media', 'media', true),
('thumbnails', 'thumbnails', true),
('merchandise', 'merchandise', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies conditionally to ensure idempotency

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class cl ON cl.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'storage' AND cl.relname = 'objects' AND pol.polname = 'Public Access to Avatars'
  ) THEN
    CREATE POLICY "Public Access to Avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class cl ON cl.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'storage' AND cl.relname = 'objects' AND pol.polname = 'Authenticated Users Can Upload Avatars'
  ) THEN
    CREATE POLICY "Authenticated Users Can Upload Avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class cl ON cl.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'storage' AND cl.relname = 'objects' AND pol.polname = 'Users Can Update Their Own Avatars'
  ) THEN
    CREATE POLICY "Users Can Update Their Own Avatars" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class cl ON cl.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'storage' AND cl.relname = 'objects' AND pol.polname = 'Public Access to Media'
  ) THEN
    CREATE POLICY "Public Access to Media" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class cl ON cl.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'storage' AND cl.relname = 'objects' AND pol.polname = 'Authenticated Users Can Upload Media'
  ) THEN
    CREATE POLICY "Authenticated Users Can Upload Media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class cl ON cl.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'storage' AND cl.relname = 'objects' AND pol.polname = 'Public Access to Thumbnails'
  ) THEN
    CREATE POLICY "Public Access to Thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class cl ON cl.oid = pol.polrelid
    JOIN pg_catalog.pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'storage' AND cl.relname = 'objects' AND pol.polname = 'Public Access to Merchandise'
  ) THEN
    CREATE POLICY "Public Access to Merchandise" ON storage.objects
    FOR SELECT USING (bucket_id = 'merchandise');
  END IF;
END;
$$;

-- Set up authentication hooks
-- Ensure the function and trigger are created or replaced idempotently.
-- The function logic itself should handle cases where related records might already exist if it's re-run.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
 -- Insert into profiles, or update if user somehow re-registers (though auth.users should prevent duplicate emails)
 INSERT INTO public.profiles (id, username, avatar_url, created_at, updated_at)
 VALUES (new.id, new.email, '', now(), now())
 ON CONFLICT (id) DO UPDATE SET
   username = EXCLUDED.username, -- or some other update logic if needed
   updated_at = now();

 -- Default to free tier, only if no tier record exists for this user
 IF NOT EXISTS (SELECT 1 FROM public.user_tiers WHERE user_id = new.id) THEN
   INSERT INTO public.user_tiers (user_id, tier_name, start_date)
   VALUES (new.id, 'free', now());
 END IF;

 -- Give new users welcome coins, only if no welcome bonus transaction exists
 IF NOT EXISTS (
   SELECT 1 FROM public.coin_transactions
   WHERE user_id = new.id AND description = 'Welcome bonus' AND transaction_type = 'credit'
 ) THEN
   INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
   VALUES (new.id, 50, 'credit', 'Welcome bonus');
 END IF;

 RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Optional: if you need to redefine the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
 AFTER INSERT ON auth.users
 FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Note: RLS policies for your public tables (profiles, user_tiers, etc.)
-- should be defined in a separate script (e.g., 09-rls-policies.sql)
-- and also made idempotent using DROP POLICY IF EXISTS or conditional creation.
-- The ALTER DEFAULT PRIVILEGES command is usually fine to run multiple times.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM public;
-- You would then GRANT specific privileges as needed.
