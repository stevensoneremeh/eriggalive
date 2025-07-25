-- Create meet_greet_sessions table
CREATE TABLE IF NOT EXISTS meet_greet_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 100000.00,
  currency TEXT NOT NULL DEFAULT 'NGN',
  transaction_reference TEXT UNIQUE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  session_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (session_status IN ('scheduled', 'active', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 20,
  daily_room_name TEXT,
  daily_room_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES meet_greet_sessions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'session_reminder' CHECK (notification_type IN ('session_reminder', 'payment_received', 'session_started')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meet_greet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meet_greet_sessions
CREATE POLICY "Users can view their own sessions" ON meet_greet_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON meet_greet_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON meet_greet_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.tier = 'blood')
    )
  );

-- RLS Policies for admin_notifications
CREATE POLICY "Admins can view all notifications" ON admin_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.tier = 'blood')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_user_id ON meet_greet_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_status ON meet_greet_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_scheduled ON meet_greet_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_session_id ON admin_notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(is_read);
