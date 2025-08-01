-- Create storage bucket for user assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('eriggalive-assets', 'eriggalive-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'eriggalive-assets');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'eriggalive-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'eriggalive-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'eriggalive-assets' 
  AND auth.role() = 'authenticated'
);
