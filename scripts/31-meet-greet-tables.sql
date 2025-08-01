-- Create meet_greet_bookings table
CREATE TABLE IF NOT EXISTS meet_greet_bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_reference VARCHAR(255) UNIQUE NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    payment_method VARCHAR(50) NOT NULL,
    reference VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    service_type VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_chat table for live chat
CREATE TABLE IF NOT EXISTS community_chat (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_comments table for post comments
CREATE TABLE IF NOT EXISTS community_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_post_votes table
CREATE TABLE IF NOT EXISTS community_post_votes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create community_comment_likes table
CREATE TABLE IF NOT EXISTS community_comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meet_greet_bookings_user_id ON meet_greet_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_meet_greet_bookings_date ON meet_greet_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_community_chat_user_id ON community_chat(user_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_created_at ON community_chat(created_at);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id ON community_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON community_post_votes(user_id);

-- Create RLS policies
ALTER TABLE meet_greet_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for meet_greet_bookings
CREATE POLICY "Users can view their own bookings" ON meet_greet_bookings
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can create their own bookings" ON meet_greet_bookings
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- RLS policies for payments
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can create their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- RLS policies for community_chat
CREATE POLICY "Anyone can view chat messages" ON community_chat
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create chat messages" ON community_chat
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- RLS policies for community_comments
CREATE POLICY "Anyone can view comments" ON community_comments
    FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create comments" ON community_comments
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own comments" ON community_comments
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- RLS policies for community_post_votes
CREATE POLICY "Anyone can view post votes" ON community_post_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on posts" ON community_post_votes
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own votes" ON community_post_votes
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Create functions for vote counting
CREATE OR REPLACE FUNCTION increment_vote_count(post_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = vote_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_vote_count(post_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = GREATEST(vote_count - 1, 0) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_comment_count(post_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE community_posts 
    SET comment_count = comment_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for live features
ALTER PUBLICATION supabase_realtime ADD TABLE community_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE community_post_votes;
