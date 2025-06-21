
-- Create storage bucket for community media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('eriggalive-assets', 'eriggalive-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community media
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'eriggalive-assets');

CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'eriggalive-assets' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'community_media'
);

CREATE POLICY "Users can update their own media" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'eriggalive-assets' 
    AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own media" ON storage.objects
FOR DELETE USING (
    bucket_id = 'eriggalive-assets' 
    AND auth.uid()::text = (storage.foldername(name))[2]
);
