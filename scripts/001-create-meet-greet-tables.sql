-- Create meet_greet_sessions table
CREATE TABLE IF NOT EXISTS meet_greet_sessions (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_reference VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'ready', 'active', 'completed', 'cancelled')),
    session_duration INTEGER DEFAULT 1200, -- 20 minutes in seconds
    actual_duration INTEGER,
    room_url TEXT,
    room_name VARCHAR(255),
    paid_at TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_status ON meet_greet_sessions(status);
CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_payment_ref ON meet_greet_sessions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_meet_greet_sessions_created_at ON meet_greet_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meet_greet_sessions_updated_at 
    BEFORE UPDATE ON meet_greet_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
