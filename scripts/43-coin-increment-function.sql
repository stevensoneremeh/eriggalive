-- Create function to safely increment user coins
CREATE OR REPLACE FUNCTION increment_user_coins(user_id UUID, coin_amount BIGINT)
RETURNS VOID AS $$
BEGIN
    -- Update user coins with proper error handling
    UPDATE public.users 
    SET coins = coins + coin_amount,
        updated_at = NOW()
    WHERE auth_user_id = user_id;
    
    -- Check if user was found and updated
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_user_coins(UUID, BIGINT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION increment_user_coins(UUID, BIGINT) IS 'Safely increments user coin balance for webhook processing';
