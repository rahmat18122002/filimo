
CREATE TABLE IF NOT EXISTS public.bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.bot_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id text NOT NULL,
  telegram_username text,
  movie_id uuid REFERENCES public.movies(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- bot_settings policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_settings' AND policyname = 'Anyone can read bot_settings') THEN
    CREATE POLICY "Anyone can read bot_settings" ON public.bot_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_settings' AND policyname = 'Anyone can manage bot_settings') THEN
    CREATE POLICY "Anyone can manage bot_settings" ON public.bot_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- bot_stats policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_stats' AND policyname = 'Anyone can read bot_stats') THEN
    CREATE POLICY "Anyone can read bot_stats" ON public.bot_stats FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_stats' AND policyname = 'Anyone can insert bot_stats') THEN
    CREATE POLICY "Anyone can insert bot_stats" ON public.bot_stats FOR INSERT WITH CHECK (true);
  END IF;
  -- notifications delete policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Anyone can delete notifications') THEN
    CREATE POLICY "Anyone can delete notifications" ON public.notifications FOR DELETE USING (true);
  END IF;
END $$;

INSERT INTO public.bot_settings (key, value) VALUES
  ('copy_protection', 'true'),
  ('auto_delete_hours', '1')
ON CONFLICT (key) DO NOTHING;
