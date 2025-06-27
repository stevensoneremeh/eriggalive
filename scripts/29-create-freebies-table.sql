-- Create freebies table for monthly free items
CREATE TABLE IF NOT EXISTS freebies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    available_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create freebies_claims table to track user claims
CREATE TABLE IF NOT EXISTS freebies_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    freebie_id UUID NOT NULL REFERENCES freebies(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, freebie_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_freebies_available_until ON freebies(available_until);
CREATE INDEX IF NOT EXISTS idx_freebies_claims_user_id ON freebies_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_freebies_claims_claimed_at ON freebies_claims(claimed_at);

-- Enable RLS
ALTER TABLE freebies ENABLE ROW LEVEL SECURITY;
ALTER TABLE freebies_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for freebies (public read)
CREATE POLICY "Anyone can view available freebies" ON freebies
    FOR SELECT USING (available_until >= NOW());

-- RLS Policies for freebies_claims
CREATE POLICY "Users can view their own claims" ON freebies_claims
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own claims" ON freebies_claims
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to check if user can claim (one per month)
CREATE OR REPLACE FUNCTION can_user_claim_freebie(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    claim_count INTEGER;
    start_of_month TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get start of current month
    start_of_month := date_trunc('month', NOW());
    
    -- Count claims this month
    SELECT COUNT(*) INTO claim_count
    FROM freebies_claims
    WHERE user_id = user_uuid
    AND claimed_at >= start_of_month;
    
    -- Return true if no claims this month
    RETURN claim_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce one claim per month
CREATE OR REPLACE FUNCTION enforce_monthly_claim_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT can_user_claim_freebie(NEW.user_id) THEN
        RAISE EXCEPTION 'User can only claim one freebie per month';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_monthly_claim_limit
    BEFORE INSERT ON freebies_claims
    FOR EACH ROW
    EXECUTE FUNCTION enforce_monthly_claim_limit();

-- Insert sample freebies for testing
INSERT INTO freebies (title, description, image_url, available_until) VALUES
(
    'Exclusive Erigga Sticker Pack',
    'Limited edition sticker pack featuring iconic Erigga artwork and quotes',
    '/placeholder.svg?height=300&width=300',
    date_trunc('month', NOW()) + interval '1 month' - interval '1 second'
),
(
    'Digital Wallpaper Collection',
    'High-quality mobile and desktop wallpapers featuring Erigga album art',
    '/placeholder.svg?height=300&width=300',
    date_trunc('month', NOW()) + interval '1 month' - interval '1 second'
),
(
    'Erigga Radio Playlist',
    'Curated playlist of Erigga''s top tracks and unreleased snippets',
    '/placeholder.svg?height=300&width=300',
    date_trunc('month', NOW()) + interval '1 month' - interval '1 second'
);

-- Grant necessary permissions
GRANT SELECT ON freebies TO authenticated;
GRANT SELECT, INSERT ON freebies_claims TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_claim_freebie(UUID) TO authenticated;
