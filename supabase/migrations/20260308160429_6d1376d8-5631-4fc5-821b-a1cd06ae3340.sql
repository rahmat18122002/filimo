CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  video_url text,
  movie_id uuid REFERENCES public.movies(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Anyone can manage stories" ON public.stories FOR ALL USING (true) WITH CHECK (true);