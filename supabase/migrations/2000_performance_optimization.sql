-- Performance Optimization Migration
-- Adds materialized views, indexes, and optimizations to reduce Supabase egress costs

-- =============================================
-- MATERIALIZED VIEWS FOR DASHBOARD STATS
-- =============================================

-- Admin dashboard statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_dashboard_stats AS
SELECT
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

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_dashboard_stats_last_updated 
ON admin_dashboard_stats(last_updated);

-- User activity summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_summary AS
SELECT
  u.id,
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

-- Create index on user activity summary
CREATE INDEX IF NOT EXISTS idx_user_activity_summary_tier ON user_activity_summary(tier);
CREATE INDEX IF NOT EXISTS idx_user_activity_summary_last_seen ON user_activity_summary(last_seen_at);

-- Withdrawal summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS withdrawal_summary AS
SELECT
  w.id,
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

-- Create index on withdrawal summary
CREATE INDEX IF NOT EXISTS idx_withdrawal_summary_status ON withdrawal_summary(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_summary_created ON withdrawal_summary(created_at DESC);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- User table indexes for activity tracking
CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at DESC) WHERE last_seen_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_tier_active ON users(tier, last_seen_at) WHERE last_seen_at >= NOW() - INTERVAL '30 days';

-- Coin transactions indexes for revenue queries
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_created ON coin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_status_type ON coin_transactions(status, transaction_type) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_coin_transactions_amount ON coin_transactions(created_at DESC, amount) WHERE status = 'completed';

-- Withdrawal indexes for admin dashboard
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created ON withdrawals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_pending ON withdrawals(created_at DESC) WHERE status = 'pending';

-- Events indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_events_date_status ON events(event_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(event_date ASC) WHERE status = 'upcoming';

-- Meet & Greet booking indexes
CREATE INDEX IF NOT EXISTS idx_meet_greet_status_date ON meet_greet_bookings(status, booking_date);
CREATE INDEX IF NOT EXISTS idx_meet_greet_pending ON meet_greet_bookings(booking_date) WHERE status = 'pending';

-- Wallet transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(user_id, type, created_at DESC);

-- Foreign key indexes for join optimization
CREATE INDEX IF NOT EXISTS idx_vault_items_created_by ON vault_items(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_streams_created_by ON live_streams(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_event_user ON tickets(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status_event ON tickets(status, event_id);

-- =============================================
-- REFRESH FUNCTIONS
-- =============================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_admin_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY withdrawal_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cached dashboard stats
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
BEGIN
  -- Return cached stats if fresh (less than 5 minutes old)
  RETURN QUERY
  SELECT * FROM admin_dashboard_stats
  WHERE admin_dashboard_stats.last_updated >= NOW() - INTERVAL '5 minutes';
  
  -- If no fresh data, refresh and return
  IF NOT FOUND THEN
    REFRESH MATERIALIZED VIEW admin_dashboard_stats;
    RETURN QUERY SELECT * FROM admin_dashboard_stats;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- QUERY OPTIMIZATION VIEWS
-- =============================================

-- Optimized user list view for admin
CREATE OR REPLACE VIEW admin_user_list AS
SELECT
  u.id,
  u.auth_user_id,
  u.username,
  u.full_name,
  u.email,
  u.tier,
  u.coins,
  u.is_verified,
  u.created_at,
  u.last_seen_at,
  um.tier_id as membership_tier,
  uw.coin_balance as wallet_balance
FROM users u
LEFT JOIN user_memberships um ON u.id = um.user_id AND um.status = 'active'
LEFT JOIN user_wallets uw ON u.id = uw.user_id;

-- Optimized withdrawal list view for admin
CREATE OR REPLACE VIEW admin_withdrawal_list AS
SELECT
  w.id,
  w.user_id,
  w.amount_coins,
  w.amount_naira,
  w.status,
  w.created_at,
  w.admin_notes,
  u.username,
  u.email,
  u.tier,
  ba.bank_name,
  ba.account_number,
  ba.account_name
FROM withdrawals w
JOIN users u ON w.user_id = u.id
JOIN bank_accounts ba ON w.bank_account_id = ba.id
ORDER BY w.created_at DESC;

-- =============================================
-- SCHEDULED REFRESH (via pg_cron if available)
-- =============================================

-- Note: Uncomment if pg_cron is available
-- SELECT cron.schedule('refresh-admin-stats', '*/5 * * * *', 'SELECT refresh_admin_stats()');

-- =============================================
-- GRANTS
-- =============================================

GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;
GRANT SELECT ON withdrawal_summary TO authenticated;
GRANT SELECT ON admin_user_list TO authenticated;
GRANT SELECT ON admin_withdrawal_list TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_admin_stats() TO authenticated;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON MATERIALIZED VIEW admin_dashboard_stats IS 'Cached dashboard statistics refreshed every 5 minutes to reduce egress costs';
COMMENT ON MATERIALIZED VIEW user_activity_summary IS 'User activity summary for admin dashboard with transaction counts';
COMMENT ON MATERIALIZED VIEW withdrawal_summary IS 'Recent withdrawals with user and bank details for admin management';
COMMENT ON FUNCTION get_admin_dashboard_stats() IS 'Returns cached dashboard stats, refreshing if older than 5 minutes';
COMMENT ON FUNCTION refresh_admin_stats() IS 'Manually refresh all materialized views for latest data';
