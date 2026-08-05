CREATE POLICY "videos_read_all" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'videos');
CREATE POLICY "videos_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND private.is_admin());
CREATE POLICY "videos_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'videos' AND private.is_admin()) WITH CHECK (bucket_id = 'videos' AND private.is_admin());
CREATE POLICY "videos_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos' AND private.is_admin());