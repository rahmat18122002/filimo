
-- Fix vip_cards RLS: drop restrictive policies and create permissive ones
DROP POLICY IF EXISTS "Anyone can manage vip_cards" ON public.vip_cards;
DROP POLICY IF EXISTS "Anyone can read vip_cards" ON public.vip_cards;

CREATE POLICY "Public read vip_cards" ON public.vip_cards FOR SELECT USING (true);
CREATE POLICY "Public manage vip_cards" ON public.vip_cards FOR ALL USING (true) WITH CHECK (true);

-- Create app_settings table for app name and other settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Public manage app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default app name
INSERT INTO public.app_settings (key, value) VALUES ('app_name', 'Filimo') ON CONFLICT (key) DO NOTHING;
