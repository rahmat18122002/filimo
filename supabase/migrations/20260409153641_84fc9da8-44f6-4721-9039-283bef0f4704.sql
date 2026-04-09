
-- Shop categories
CREATE TABLE public.shop_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shop_categories" ON public.shop_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can manage shop_categories" ON public.shop_categories FOR ALL USING (true) WITH CHECK (true);

-- Shop products
CREATE TABLE public.shop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL DEFAULT '',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shop_products" ON public.shop_products FOR SELECT USING (true);
CREATE POLICY "Anyone can manage shop_products" ON public.shop_products FOR ALL USING (true) WITH CHECK (true);

-- Product images (multiple per product)
CREATE TABLE public.shop_product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shop_product_images" ON public.shop_product_images FOR SELECT USING (true);
CREATE POLICY "Anyone can manage shop_product_images" ON public.shop_product_images FOR ALL USING (true) WITH CHECK (true);

-- Cart items
CREATE TABLE public.shop_cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(device_id, product_id)
);
ALTER TABLE public.shop_cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage cart" ON public.shop_cart_items FOR ALL USING (true) WITH CHECK (true);

-- Orders
CREATE TABLE public.shop_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'transfer',
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shop_orders" ON public.shop_orders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shop_orders" ON public.shop_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shop_orders" ON public.shop_orders FOR UPDATE USING (true);

-- Order items
CREATE TABLE public.shop_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read shop_order_items" ON public.shop_order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shop_order_items" ON public.shop_order_items FOR INSERT WITH CHECK (true);

-- Storage bucket for shop images
INSERT INTO storage.buckets (id, name, public) VALUES ('shop', 'shop', true);
CREATE POLICY "Anyone can read shop files" ON storage.objects FOR SELECT USING (bucket_id = 'shop');
CREATE POLICY "Anyone can upload shop files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shop');
CREATE POLICY "Anyone can update shop files" ON storage.objects FOR UPDATE USING (bucket_id = 'shop');
CREATE POLICY "Anyone can delete shop files" ON storage.objects FOR DELETE USING (bucket_id = 'shop');

-- Insert default categories
INSERT INTO public.shop_categories (name, icon, sort_order) VALUES
  ('Электроника', '📱', 1),
  ('Аксессуары', '🎧', 2),
  ('Гаджеты', '⌚', 3),
  ('Другое', '📚', 4);
