-- Function to update coin balance after successful transaction
CREATE OR REPLACE FUNCTION update_coin_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if transaction status changed to 'success'
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    UPDATE profiles 
    SET coin_balance = coin_balance + NEW.coins_credited,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic coin balance updates
DROP TRIGGER IF EXISTS trigger_update_coin_balance ON transactions;
CREATE TRIGGER trigger_update_coin_balance
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_coin_balance_on_transaction();

-- Function to deduct coins on withdrawal request
CREATE OR REPLACE FUNCTION deduct_coins_on_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Deduct coins from user's balance
  UPDATE profiles 
  SET coin_balance = coin_balance - NEW.coins_deducted,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Check if user has sufficient balance
  IF NOT FOUND OR (SELECT coin_balance FROM profiles WHERE id = NEW.user_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient coin balance for withdrawal';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic coin deduction on withdrawal
DROP TRIGGER IF EXISTS trigger_deduct_coins_on_withdrawal ON withdrawals;
CREATE TRIGGER trigger_deduct_coins_on_withdrawal
  BEFORE INSERT ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION deduct_coins_on_withdrawal();
