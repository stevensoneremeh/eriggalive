-- Create meet_greet_payments table
CREATE TABLE IF NOT EXISTS meet_greet_payments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    preferred_time TEXT,
    special_requests TEXT,
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meet_greet_sessions table
CREATE TABLE IF NOT EXISTS meet_greet_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_id INTEGER REFERENCES meet_greet_payments(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'active', 'completed', 'cancelled')),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 20,
    room_url TEXT,
    room_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meet_greet_payments_user_id ON meet_greet_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_meet_greet_payments_reference ON meet_greet_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_meet_greet_payments_status ON meet_greet_payments(status);

CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_user_id ON meet_greet_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_payment_id ON meet_greet_sessions(payment_id);
CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_status ON meet_greet_sessions(status);
CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_scheduled_time ON meet_greet_sessions(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE meet_greet_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meet_greet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payments" ON meet_greet_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON meet_greet_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON meet_greet_payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" ON meet_greet_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON meet_greet_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON meet_greet_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin notifications are only accessible by admins (you can adjust this based on your admin system)
CREATE POLICY "Only admins can access notifications" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Create triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meet_greet_payments_updated_at 
    BEFORE UPDATE ON meet_greet_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meet_greet_sessions_updated_at 
    BEFORE UPDATE ON meet_greet_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
