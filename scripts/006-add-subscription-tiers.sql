-- Add subscription tier and location fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'Grassroot' CHECK (subscription_tier IN ('Grassroot', 'Pioneer', 'Elder', 'Blood')),
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS state_province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Update chat_rooms to include tier-specific rooms
INSERT INTO public.chat_rooms (name, description, is_private) VALUES
('Grassroot Chat', 'Chat room for Grassroot tier members', false),
('Pioneer Chat', 'Chat room for Pioneer tier members', false),
('Elder Chat', 'Chat room for Elder tier members', false),
('Blood Chat', 'Chat room for Blood tier members', false),
('Global Announcements', 'Admin announcements to all tiers', false)
ON CONFLICT (name) DO NOTHING;

-- Add tier column to chat_rooms for filtering
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('Grassroot', 'Pioneer', 'Elder', 'Blood', 'Global'));

-- Update existing rooms with tier info
UPDATE public.chat_rooms SET tier = 'Grassroot' WHERE name = 'Grassroot Chat';
UPDATE public.chat_rooms SET tier = 'Pioneer' WHERE name = 'Pioneer Chat';
UPDATE public.chat_rooms SET tier = 'Elder' WHERE name = 'Elder Chat';
UPDATE public.chat_rooms SET tier = 'Blood' WHERE name = 'Blood Chat';
UPDATE public.chat_rooms SET tier = 'Global' WHERE name = 'Global Announcements';

-- Add admin role support
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create admin messages table for global announcements
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_tiers TEXT[] DEFAULT ARRAY['Grassroot', 'Pioneer', 'Elder', 'Blood'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
