-- Fix UUID type issues in community schema

-- First, let's check the actual data type of auth_user_id in users table
DO $$
DECLARE
    auth_user_id_type TEXT;
BEGIN
    SELECT data_type INTO auth_user_id_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'auth_user_id';
    
    RAISE NOTICE 'Current auth_user_id column type: %', auth_user_id_type;
    
    -- If it's text, convert it to UUID
    IF auth_user_id_type = 'text' THEN
        RAISE NOTICE 'Converting auth_user_id from text to uuid...';
        
        -- First, ensure all values are valid UUIDs
        UPDATE public.users 
        SET auth_user_id = auth_user_id::uuid::text 
        WHERE auth_user_id IS NOT NULL;
        
        -- Then change the column type
        ALTER TABLE public.users 
        ALTER COLUMN auth_user_id TYPE UUID USING auth_user_id::uuid;
        
        RAISE NOTICE 'Successfully converted auth_user_id to UUID type';
    ELSE
        RAISE NOTICE 'auth_user_id is already UUID type';
    END IF;
END $$;

-- Drop and recreate the handle_post_vote function with proper UUID handling
DROP FUNCTION IF EXISTS public.handle_post_vote(BIGINT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.handle_post_vote(BIGINT, UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.handle_post_vote(
    p_post_id BIGINT,
    p_voter_auth_id UUID,
    p_post_creator_auth_id UUID,
    p_coin_amount INTEGER DEFAULT 100
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voter_id BIGINT;
    v_post_creator_id BIGINT;
    v_voter_coins INTEGER;
    v_existing_vote BOOLEAN;
BEGIN
    -- Get voter's internal ID and coin balance
    SELECT id, coins INTO v_voter_id, v_voter_coins
    FROM public.users 
    WHERE auth_user_id = p_voter_auth_id;
    
    IF v_voter_id IS NULL THEN
        RAISE EXCEPTION 'Voter not found';
    END IF;
    
    -- Get post creator's internal ID
    SELECT id INTO v_post_creator_id
    FROM public.users 
    WHERE auth_user_id = p_post_creator_auth_id;
    
    IF v_post_creator_id IS NULL THEN
        RAISE EXCEPTION 'Post creator not found';
    END IF;
    
    -- Check if voter is trying to vote on their own post
    IF v_voter_id = v_post_creator_id THEN
        RAISE EXCEPTION 'Cannot vote on own post';
    END IF;
    
    -- Check if user has enough coins
    IF v_voter_coins < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;
    
    -- Check if user has already voted
    SELECT EXISTS(
        SELECT 1 FROM public.community_post_votes 
        WHERE post_id = p_post_id AND user_id = v_voter_id
    ) INTO v_existing_vote;
    
    IF v_existing_vote THEN
        -- Remove vote and refund coins
        DELETE FROM public.community_post_votes 
        WHERE post_id = p_post_id AND user_id = v_voter_id;
        
        -- Update vote count
        UPDATE public.community_posts 
        SET vote_count = GREATEST(vote_count - 1, 0)
        WHERE id = p_post_id;
        
        -- Refund coins to voter
        UPDATE public.users 
        SET coins = coins + p_coin_amount 
        WHERE id = v_voter_id;
        
        -- Remove coins from post creator
        UPDATE public.users 
        SET coins = GREATEST(coins - p_coin_amount, 0)
        WHERE id = v_post_creator_id;
        
        -- Record refund transaction (if coin_transactions table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coin_transactions') THEN
            INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
            VALUES (v_voter_id, p_coin_amount, 'refund', 'Vote removed - refund', 'completed');
            
            INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
            VALUES (v_post_creator_id, -p_coin_amount, 'refund', 'Vote removed - deduction', 'completed');
        END IF;
        
        RETURN FALSE; -- Vote removed
    ELSE
        -- Add vote
        INSERT INTO public.community_post_votes (post_id, user_id)
        VALUES (p_post_id, v_voter_id);
        
        -- Update vote count
        UPDATE public.community_posts 
        SET vote_count = vote_count + 1 
        WHERE id = p_post_id;
        
        -- Transfer coins from voter to post creator
        UPDATE public.users 
        SET coins = coins - p_coin_amount 
        WHERE id = v_voter_id;
        
        UPDATE public.users 
        SET coins = coins + p_coin_amount 
        WHERE id = v_post_creator_id;
        
        -- Record transactions (if coin_transactions table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coin_transactions') THEN
            INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
            VALUES (v_voter_id, -p_coin_amount, 'content_access', 'Post vote', 'completed');
            
            INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
            VALUES (v_post_creator_id, p_coin_amount, 'reward', 'Post vote received', 'completed');
        END IF;
        
        RETURN TRUE; -- Vote added
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_post_vote(BIGINT, UUID, UUID, INTEGER) TO authenticated;

-- Update RLS policies to handle UUID properly
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.community_post_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.community_post_votes;
DROP POLICY IF EXISTS "Authenticated users can like" ON public.community_comment_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.community_comment_likes;
DROP POLICY IF EXISTS "Authenticated users can report" ON public.community_reports;
DROP POLICY IF EXISTS "Users can read own reports" ON public.community_reports;

-- Recreate RLS policies with proper UUID handling
CREATE POLICY "Authenticated users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Users can update own posts" ON public.community_posts
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Users can delete own posts" ON public.community_posts
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Authenticated users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Users can update own comments" ON public.community_comments
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Users can delete own comments" ON public.community_comments
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Authenticated users can vote" ON public.community_post_votes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Users can delete own votes" ON public.community_post_votes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Authenticated users can like" ON public.community_comment_likes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Users can delete own likes" ON public.community_comment_likes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

CREATE POLICY "Authenticated users can report" ON public.community_reports
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = reporter_user_id)
    );

CREATE POLICY "Users can read own reports" ON public.community_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = reporter_user_id)
    );

-- Verify the setup
DO $$
DECLARE
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'handle_post_vote';
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'community_%';
    
    RAISE NOTICE 'UUID fix completed successfully!';
    RAISE NOTICE 'Functions updated: %', function_count;
    RAISE NOTICE 'RLS policies updated: %', policy_count;
    
    IF function_count = 0 THEN
        RAISE WARNING 'handle_post_vote function was not created properly';
    END IF;
END $$;
