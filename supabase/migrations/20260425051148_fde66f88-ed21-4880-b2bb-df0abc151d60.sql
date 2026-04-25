-- Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read push_subscriptions" ON public.push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert push_subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update push_subscriptions" ON public.push_subscriptions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete push_subscriptions" ON public.push_subscriptions FOR DELETE USING (true);

-- Save VAPID keys in app_settings (so edge function and frontend can read them)
INSERT INTO public.app_settings (key, value) VALUES
  ('vapid_public_key', 'BOoNqh2FmKnef4KSIjFnFbihzkXwmkTvanYLFYkZa12jvppSBNrkgPDtDAjlA4ZC0tRvsaHuETbhY0JZ89STQuo'),
  ('vapid_private_key', 'yjlOFcQ80nBgzkY796Zr8hwkALI9_rsGc8uH0fvXi-I'),
  ('vapid_subject', 'mailto:admin@filimo.app')
ON CONFLICT (key) DO NOTHING;

-- Need a unique constraint on app_settings.key for upsert
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_key_unique ON public.app_settings(key);

-- Enable pg_net for triggering edge function
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger function: call edge function when new movie is added
CREATE OR REPLACE FUNCTION public.notify_push_new_movie()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://mxqkxcbqinmlobopxuin.supabase.co/functions/v1/send-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'title', 'Новый фильм! 🎬',
      'body', NEW.title,
      'movie_id', NEW.id::text,
      'poster', NEW.poster
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_on_new_movie ON public.movies;
CREATE TRIGGER push_on_new_movie
AFTER INSERT ON public.movies
FOR EACH ROW
EXECUTE FUNCTION public.notify_push_new_movie();