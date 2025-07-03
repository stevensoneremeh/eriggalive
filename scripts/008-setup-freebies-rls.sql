-- Enable RLS on freebies tables
ALTER TABLE public.freebies_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebies_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebies_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebies_comments ENABLE ROW LEVEL SECURITY;

-- Freebies posts policies
CREATE POLICY "Freebies posts are viewable by everyone" ON public.freebies_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create freebies posts" ON public.freebies_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own freebies posts" ON public.freebies_posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own freebies posts" ON public.freebies_posts
    FOR DELETE USING (auth.uid() = author_id);

-- Freebies votes policies
CREATE POLICY "Freebies votes are viewable by everyone" ON public.freebies_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on freebies" ON public.freebies_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own freebies votes" ON public.freebies_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own freebies votes" ON public.freebies_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Freebies likes policies
CREATE POLICY "Freebies likes are viewable by everyone" ON public.freebies_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like freebies" ON public.freebies_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own freebies likes" ON public.freebies_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Freebies comments policies
CREATE POLICY "Freebies comments are viewable by everyone" ON public.freebies_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create freebies comments" ON public.freebies_comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own freebies comments" ON public.freebies_comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own freebies comments" ON public.freebies_comments
    FOR DELETE USING (auth.uid() = author_id);
