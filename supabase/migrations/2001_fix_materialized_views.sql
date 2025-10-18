-- Fix Materialized Views - Add unique indexes and proper refresh logic
-- This migration fixes the issues found in 2000_performance_optimization.sql

-- Drop existing materialized views to recreate them properly
DROP MATERIALIZED VIEW IF EXISTS admin_dashboard_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS user_activity_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS withdrawal_summary CASCADE;

-- =============================================
-- RECREATE MATERIALIZED VIEWS WITH UNIQUE INDEXES
-- =============================================

-- Admin dashboard statistics view (with unique constraint)
CREATE MATERIALIZED VIEW admin_dashboard_stats AS
SELECT
  1 as id, -- Single row, unique ID for CONCURRENT refresh
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '30 days') as active_users_30d,
  (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
  (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions WHERE status = 'completed') as total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions 
   WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', NOW())) as monthly_revenue,
  (SELECT COUNT(*) FROM events WHERE status = 'upcoming') as upcoming_events,
  (SELECT COUNT(*) FROM live_streams WHERE status = 'active') as active_streams,
  (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') as pending_withdrawals,
  (SELECT COALESCE(SUM(amount_naira), 0) FROM withdrawals WHERE status = 'pending') as pending_withdrawal_amount,
  NOW() as last_updated;

-- Create UNIQUE index required for CONCURRENT refresh
CREATE UNIQUE INDEX idx_admin_dashboard_stats_id ON admin_dashboard_stats(id);

-- User activity summary view (with unique ID)
CREATE MATERIALIZED VIEW user_activity_summary AS
SELECT
  u.id as id, -- User ID is unique
  u.username,
  u.email,
  u.tier,
  u.coins,
  u.last_seen_at,
  u.created_at,
  COUNT(DISTINCT t.id) as total_tickets,
  COUNT(DISTINCT ct.id) as total_transactions,
  COALESCE(SUM(ct.amount), 0) as total_spent
FROM users u
LEFT JOIN tickets t ON u.id = t.user_id
LEFT JOIN coin_transactions ct ON u.id = ct.user_id
GROUP BY u.id, u.username, u.email, u.tier, u.coins, u.last_seen_at, u.created_at;

-- Create UNIQUE index on user ID
CREATE UNIQUE INDEX idx_user_activity_summary_id ON user_activity_summary(id);

-- Withdrawal summary view (with unique ID)
CREATE MATERIALIZED VIEW withdrawal_summary AS
SELECT
  w.id as id, -- Withdrawal ID is unique
  w.user_id,
  u.username,
  u.email,
  w.amount_coins,
  w.amount_naira,
  w.status,
  w.created_at,
  ba.bank_name,
  ba.account_number,
  ba.account_name
FROM withdrawals w
JOIN users u ON w.user_id = u.id
JOIN bank_accounts ba ON w.bank_account_id = ba.id
WHERE w.created_at >= NOW() - INTERVAL '90 days';

-- Create UNIQUE index on withdrawal ID
CREATE UNIQUE INDEX idx_withdrawal_summary_id ON withdrawal_summary(id);

-- =============================================
-- FIXED REFRESH FUNCTION (refreshes ALL views)
-- =============================================

CREATE OR REPLACE FUNCTION refresh_admin_stats()
RETURNS void AS $$
BEGIN
  -- Refresh all materialized views concurrently
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY withdrawal_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FIXED GET STATS FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users_30d BIGINT,
  new_users_30d BIGINT,
  total_revenue NUMERIC,
  monthly_revenue NUMERIC,
  upcoming_events BIGINT,
  active_streams BIGINT,
  pending_withdrawals BIGINT,
  pending_withdrawal_amount NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  stats_age INTERVAL;
BEGIN
  -- Check age of cached stats
  SELECT NOW() - admin_dashboard_stats.last_updated INTO stats_age
  FROM admin_dashboard_stats
  WHERE id = 1;
  
  -- If stats are older than 5 minutes, refresh them
  IF NOT FOUND OR stats_age > INTERVAL '5 minutes' THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
  END IF;
  
  -- Return the stats
  RETURN QUERY
  SELECT 
    admin_dashboard_stats.total_users,
    admin_dashboard_stats.active_users_30d,
    admin_dashboard_stats.new_users_30d,
    admin_dashboard_stats.total_revenue,
    admin_dashboard_stats.monthly_revenue,
    admin_dashboard_stats.upcoming_events,
    admin_dashboard_stats.active_streams,
    admin_dashboard_stats.pending_withdrawals,
    admin_dashboard_stats.pending_withdrawal_amount,
    admin_dashboard_stats.last_updated
  FROM admin_dashboard_stats
  WHERE admin_dashboard_stats.id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANTS (maintain same permissions)
-- =============================================

GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;
GRANT SELECT ON withdrawal_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_admin_stats() TO authenticated;

COMMENT ON MATERIALIZED VIEW admin_dashboard_stats IS 'Cached dashboard statistics with unique index for CONCURRENT refresh';
COMMENT ON MATERIALIZED VIEW user_activity_summary IS 'User activity summary with unique index per user';
COMMENT ON MATERIALIZED VIEW withdrawal_summary IS 'Recent withdrawals with unique index per withdrawal';
