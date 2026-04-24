-- Sellers table
CREATE TABLE public.shop_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  subscription_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shop_sellers" ON public.shop_sellers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shop_sellers" ON public.shop_sellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shop_sellers" ON public.shop_sellers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete shop_sellers" ON public.shop_sellers FOR DELETE USING (true);

CREATE INDEX idx_shop_sellers_device_id ON public.shop_sellers(device_id);

-- Seller plans
CREATE TABLE public.shop_seller_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  days INTEGER NOT NULL DEFAULT 30,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_seller_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage shop_seller_plans" ON public.shop_seller_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read shop_seller_plans" ON public.shop_seller_plans FOR SELECT USING (true);

INSERT INTO public.shop_seller_plans (label, price, days, sort_order) VALUES
  ('1 месяц', 100, 30, 1),
  ('3 месяца', 270, 90, 2),
  ('1 год', 900, 365, 3);

-- Subscription payments
CREATE TABLE public.shop_seller_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  screenshot_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_seller_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shop_seller_subscriptions" ON public.shop_seller_subscriptions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shop_seller_subscriptions" ON public.shop_seller_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shop_seller_subscriptions" ON public.shop_seller_subscriptions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete shop_seller_subscriptions" ON public.shop_seller_subscriptions FOR DELETE USING (true);

-- Add seller_id to products and orders
ALTER TABLE public.shop_products ADD COLUMN seller_id UUID;
ALTER TABLE public.shop_orders ADD COLUMN seller_id UUID;

CREATE INDEX idx_shop_products_seller_id ON public.shop_products(seller_id);
CREATE INDEX idx_shop_orders_seller_id ON public.shop_orders(seller_id);