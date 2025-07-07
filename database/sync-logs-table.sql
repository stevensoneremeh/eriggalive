-- Create sync_logs table for tracking synchronization operations
CREATE TABLE IF NOT EXISTS sync_logs (
    id BIGSERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL DEFAULT 'manual',
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    dry_run BOOLEAN NOT NULL DEFAULT true,
    processed_count INTEGER NOT NULL DEFAULT 0,
    created_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    deleted_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON sync_logs(sync_type);

-- Add RLS policy for admin access only
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view sync logs" ON sync_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert sync logs" ON sync_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_sync_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_logs_updated_at
    BEFORE UPDATE ON sync_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_logs_updated_at();
