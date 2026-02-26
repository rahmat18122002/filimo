
-- VIP plans table
CREATE TABLE public.vip_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  months integer, -- null = forever
  price integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vip_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read vip_plans" ON public.vip_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can manage vip_plans" ON public.vip_plans FOR ALL USING (true);

-- Admin payment cards
CREATE TABLE public.vip_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_number text NOT NULL,
  card_label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vip_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read vip_cards" ON public.vip_cards FOR SELECT USING (true);
CREATE POLICY "Anyone can manage vip_cards" ON public.vip_cards FOR ALL USING (true);

-- Payment screenshot requests
CREATE TABLE public.vip_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.vip_plans(id) ON DELETE CASCADE,
  screenshot_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vip_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read vip_payments" ON public.vip_payments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vip_payments" ON public.vip_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vip_payments" ON public.vip_payments FOR UPDATE USING (true);

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true);
CREATE POLICY "Anyone can upload screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots');
CREATE POLICY "Anyone can view screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'screenshots');

-- Seed VIP plans
INSERT INTO public.vip_plans (label, months, price, sort_order) VALUES
  ('2 месяца', 2, 250, 1),
  ('3 месяца', 3, 350, 2),
  ('Навсегда', null, 1500, 3);
