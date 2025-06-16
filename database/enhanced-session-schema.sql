-- Enhanced user sessions table with all required fields
DROP TABLE IF EXISTS user_sessions CASCADE;

CREATE TABLE user_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  remember_me BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);

-- Function to increment login count
CREATE OR REPLACE FUNCTION increment_login_count(user_id BIGINT)
RETURNS BIGINT AS $$
BEGIN
  UPDATE users 
  SET login_count = COALESCE(login_count, 0) + 1
  WHERE id = user_id;
  
  RETURN (SELECT login_count FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() 
     OR (is_active = false AND updated_at < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce session limits
CREATE OR REPLACE FUNCTION enforce_session_limit()
RETURNS TRIGGER AS $$
DECLARE
  session_count INTEGER;
  max_sessions INTEGER := 3;
BEGIN
  -- Count active sessions for this user
  SELECT COUNT(*) INTO session_count
  FROM user_sessions
  WHERE user_id = NEW.user_id AND is_active = true;
  
  -- If we're at or over the limit, deactivate oldest sessions
  IF session_count >= max_sessions THEN
    UPDATE user_sessions
    SET is_active = false
    WHERE user_id = NEW.user_id
      AND is_active = true
      AND id NOT IN (
        SELECT id FROM user_sessions
        WHERE user_id = NEW.user_id AND is_active = true
        ORDER BY last_activity DESC
        LIMIT max_sessions - 1
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce session limits
DROP TRIGGER IF EXISTS trigger_enforce_session_limit ON user_sessions;
CREATE TRIGGER trigger_enforce_session_limit
  AFTER INSERT ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_session_limit();

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for session activity updates
DROP TRIGGER IF EXISTS trigger_update_session_activity ON user_sessions;
CREATE TRIGGER trigger_update_session_activity
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Enhanced RLS policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (
    auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id)
  );

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (
    auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id)
  );

-- Service role can manage all sessions
CREATE POLICY "Service role can manage sessions" ON user_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid()::text 
      AND role IN ('admin', 'super_admin')
    )
  );
