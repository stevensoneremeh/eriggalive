-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat message votes table
CREATE TABLE IF NOT EXISTS chat_message_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_message_votes_message_id ON chat_message_votes(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_votes_user_id ON chat_message_votes(user_id);

-- Create function to update vote count
CREATE OR REPLACE FUNCTION update_chat_message_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_messages 
        SET vote_count = (
            SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
            FROM chat_message_votes 
            WHERE message_id = NEW.message_id
        )
        WHERE id = NEW.message_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE chat_messages 
        SET vote_count = (
            SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
            FROM chat_message_votes 
            WHERE message_id = NEW.message_id
        )
        WHERE id = NEW.message_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_messages 
        SET vote_count = (
            SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
            FROM chat_message_votes 
            WHERE message_id = OLD.message_id
        )
        WHERE id = OLD.message_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update vote counts
DROP TRIGGER IF EXISTS trigger_update_chat_message_vote_count ON chat_message_votes;
CREATE TRIGGER trigger_update_chat_message_vote_count
    AFTER INSERT OR UPDATE OR DELETE ON chat_message_votes
    FOR EACH ROW EXECUTE FUNCTION update_chat_message_vote_count();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on chat_messages
DROP TRIGGER IF EXISTS trigger_update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER trigger_update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view all chat messages" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can update their own chat messages" ON chat_messages
    FOR UPDATE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can delete their own chat messages" ON chat_messages
    FOR DELETE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

-- RLS Policies for chat_message_votes
CREATE POLICY "Users can view all chat message votes" ON chat_message_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON chat_message_votes
    FOR INSERT WITH CHECK (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can update their own votes" ON chat_message_votes
    FOR UPDATE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can delete their own votes" ON chat_message_votes
    FOR DELETE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

-- Insert some sample chat rooms data (optional)
COMMENT ON TABLE chat_messages IS 'Stores chat messages for tier-based chat rooms';
COMMENT ON TABLE chat_message_votes IS 'Stores votes for chat messages';
