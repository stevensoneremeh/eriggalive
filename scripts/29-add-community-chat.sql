-- Create community_chat table for real-time messaging
CREATE TABLE IF NOT EXISTS public.community_chat (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_chat_created_at ON public.community_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_chat_user_id ON public.community_chat(user_id);

-- Add RLS policies
ALTER TABLE public.community_chat ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all chat messages
CREATE POLICY "Users can read all chat messages" ON public.community_chat
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own messages
CREATE POLICY "Users can insert their own chat messages" ON public.community_chat
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Allow users to update their own messages (for editing)
CREATE POLICY "Users can update their own chat messages" ON public.community_chat
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own chat messages" ON public.community_chat
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_chat_updated_at BEFORE UPDATE ON public.community_chat
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.community_chat TO authenticated;
GRANT ALL ON public.community_chat TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.community_chat_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.community_chat_id_seq TO service_role;
