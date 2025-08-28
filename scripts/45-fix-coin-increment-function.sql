-- Correctly increment total_earned in user_wallets
CREATE OR REPLACE FUNCTION public.increment_total_earned(user_id integer, amount numeric)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_wallets
  SET
    coin_balance = coin_balance + amount,
    total_earned = total_earned + amount,
    last_transaction_at = NOW(),
    updated_at = NOW()
  WHERE user_id = user_id;

  -- If the user doesn't have a wallet, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_wallets (user_id, coin_balance, total_earned, last_transaction_at, updated_at)
    VALUES (user_id, amount, amount, NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set the search path for security
ALTER FUNCTION public.increment_total_earned(integer, numeric) SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_total_earned(integer, numeric) TO authenticated;
