-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'user-avatars', 
  'user-avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for user avatars - users can only upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects 
FOR SELECT USING (bucket_id = 'user-avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
