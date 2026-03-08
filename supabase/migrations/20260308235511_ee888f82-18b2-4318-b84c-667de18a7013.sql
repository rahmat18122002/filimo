
CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert story_views" ON public.story_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read story_views" ON public.story_views FOR SELECT USING (true);

CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
