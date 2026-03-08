
-- Create a dedicated stories storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read stories files"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

-- Allow public upload
CREATE POLICY "Public upload stories files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stories');

-- Allow public delete
CREATE POLICY "Public delete stories files"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories');
