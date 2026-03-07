
CREATE TABLE public.live_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text NOT NULL DEFAULT '',
  stream_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Общие',
  source text NOT NULL DEFAULT 'sputnik',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.live_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read live_channels" ON public.live_channels FOR SELECT USING (true);
CREATE POLICY "Anyone can manage live_channels" ON public.live_channels FOR ALL USING (true) WITH CHECK (true);
