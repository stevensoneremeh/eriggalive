-- Meet & Greet Payments Table
-- This table stores payment records for Meet & Greet video call sessions

CREATE TABLE IF NOT EXISTS meetgreet_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
    paystack_data JSONB, -- Store complete Paystack response
    webhook_verified BOOLEAN DEFAULT FALSE,
    session_room_id VARCHAR(100), -- ZEGOCLOUD room ID for the session
    session_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, active, completed, cancelled
    session_start_time TIMESTAMP WITH TIME ZONE,
    session_end_time TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Payment validity expiration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetgreet_payments_user_id ON meetgreet_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_meetgreet_payments_reference ON meetgreet_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_meetgreet_payments_status ON meetgreet_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_meetgreet_payments_expires_at ON meetgreet_payments(expires_at);

-- RLS Policies for security
ALTER TABLE meetgreet_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payments
CREATE POLICY "Users can view own payments" ON meetgreet_payments
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own payments
CREATE POLICY "Users can insert own payments" ON meetgreet_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Only service role can update payments (for webhooks)
CREATE POLICY "Service role can update payments" ON meetgreet_payments
    FOR UPDATE USING (auth.role() = 'service_role');

-- Admin policy: Admins can view all payments
CREATE POLICY "Admins can view all payments" ON meetgreet_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND tier IN ('admin', 'moderator')
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meetgreet_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_meetgreet_payments_updated_at
    BEFORE UPDATE ON meetgreet_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_meetgreet_payments_updated_at();

-- Function to check if user has valid payment for Meet & Greet
CREATE OR REPLACE FUNCTION has_valid_meetgreet_payment(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM meetgreet_payments
        WHERE user_id = user_uuid
        AND payment_status = 'completed'
        AND expires_at > NOW()
        AND session_status IN ('scheduled', 'active')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's active Meet & Greet session
CREATE OR REPLACE FUNCTION get_active_meetgreet_session(user_uuid UUID)
RETURNS TABLE (
    payment_id UUID,
    session_room_id VARCHAR(100),
    session_status VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mp.id,
        mp.session_room_id,
        mp.session_status,
        mp.expires_at
    FROM meetgreet_payments mp
    WHERE mp.user_id = user_uuid
    AND mp.payment_status = 'completed'
    AND mp.expires_at > NOW()
    AND mp.session_status IN ('scheduled', 'active')
    ORDER BY mp.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE meetgreet_payments IS 'Stores payment records and session information for Meet & Greet video calls';
COMMENT ON COLUMN meetgreet_payments.payment_reference IS 'Unique payment reference from Paystack';
COMMENT ON COLUMN meetgreet_payments.paystack_data IS 'Complete Paystack payment response for audit trail';
COMMENT ON COLUMN meetgreet_payments.session_room_id IS 'ZEGOCLOUD room ID for the video call session';
COMMENT ON COLUMN meetgreet_payments.expires_at IS 'When the payment expires (24 hours from payment)';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON meetgreet_payments TO service_role;
GRANT SELECT, INSERT ON meetgreet_payments TO authenticated;