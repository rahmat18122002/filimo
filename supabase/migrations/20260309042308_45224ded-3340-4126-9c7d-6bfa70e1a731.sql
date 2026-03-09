
-- Table for story likes with timestamp for 24h auto-cleanup
CREATE TABLE public.story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert story_likes" ON public.story_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read story_likes" ON public.story_likes FOR SELECT USING (true);

-- Function to clean up likes older than 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_old_story_likes()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.story_likes WHERE created_at < now() - interval '24 hours';
$$;
