-- Execute the ludo game schema
\i database/15-ludo-game-schema.sql

-- Insert some sample data for testing
INSERT INTO public.ludo_games (
    name,
    creator_id,
    creator_username,
    players,
    max_players,
    game_status,
    entry_fee,
    prize_pool
) VALUES
(
    'Quick Game',
    (SELECT auth_user_id FROM public.users LIMIT 1),
    (SELECT username FROM public.users LIMIT 1),
    '[]'::jsonb,
    4,
    'waiting',
    10,
    10
),
(
    'High Stakes',
    (SELECT auth_user_id FROM public.users LIMIT 1 OFFSET 1),
    (SELECT username FROM public.users LIMIT 1 OFFSET 1),
    '[]'::jsonb,
    4,
    'waiting', 
    50,
    50
) ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 
    'ludo_games table' as component,
    COUNT(*) as count,
    'created' as status
FROM public.ludo_games;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'ludo_games';
