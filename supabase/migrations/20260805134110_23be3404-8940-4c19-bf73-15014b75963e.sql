-- ============ helpers in private schema (not exposed to the API) ============
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION private.current_device_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.headers', true)::json ->> 'x-device-id', '');
$$;

CREATE OR REPLACE FUNCTION private.owns_seller(_seller_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _seller_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shop_sellers s
    WHERE s.id = _seller_id AND s.device_id = private.current_device_id()
  );
$$;

CREATE OR REPLACE FUNCTION private.owns_app_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE u.id = _user_id AND u.device_id = private.current_device_id()
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_device_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owns_seller(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owns_app_user(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.is_admin());
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

-- bootstrap: the very first signed-in user may claim the admin role
CREATE OR REPLACE FUNCTION public.claim_admin_if_unclaimed()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT DO NOTHING;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_admin_if_unclaimed() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_unclaimed() TO authenticated;

-- ============ move SECURITY DEFINER helpers out of the exposed schema ============
DROP FUNCTION IF EXISTS public.increment_movie_views(uuid);
DROP FUNCTION IF EXISTS public.cleanup_old_story_likes();

CREATE OR REPLACE FUNCTION private.cleanup_old_story_likes()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.story_likes WHERE created_at < now() - interval '24 hours';
$$;
REVOKE ALL ON FUNCTION private.cleanup_old_story_likes() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS on_new_movie_notify ON public.movies;
DROP TRIGGER IF EXISTS push_on_new_movie ON public.movies;
DROP FUNCTION IF EXISTS public.notify_users_new_movie();
DROP FUNCTION IF EXISTS public.notify_push_new_movie();

CREATE OR REPLACE FUNCTION private.notify_users_new_movie()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, movie_id)
  SELECT id, 'Новый фильм! 🎬', 'Добавлен новый фильм: ' || NEW.title, NEW.id
  FROM public.app_users;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.notify_push_new_movie()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://mxqkxcbqinmlobopxuin.supabase.co/functions/v1/send-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'title', 'Новый фильм! 🎬', 'body', NEW.title,
      'movie_id', NEW.id::text, 'poster', NEW.poster)
  );
  RETURN NEW;
END $$;

CREATE TRIGGER on_new_movie_notify AFTER INSERT ON public.movies
  FOR EACH ROW EXECUTE FUNCTION private.notify_users_new_movie();
CREATE TRIGGER push_on_new_movie AFTER INSERT ON public.movies
  FOR EACH ROW EXECUTE FUNCTION private.notify_push_new_movie();

-- view counting without giving visitors write access to movies
CREATE TABLE IF NOT EXISTS public.movie_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.movie_view_events TO anon, authenticated;
GRANT ALL ON public.movie_view_events TO service_role;
ALTER TABLE public.movie_view_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can record a view" ON public.movie_view_events;
CREATE POLICY "Anyone can record a view" ON public.movie_view_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read view events" ON public.movie_view_events;
CREATE POLICY "Admins read view events" ON public.movie_view_events
  FOR SELECT TO authenticated USING (private.is_admin());

CREATE OR REPLACE FUNCTION private.bump_movie_views()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.movies SET view_count = view_count + 1 WHERE id = NEW.movie_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS bump_movie_views_trg ON public.movie_view_events;
CREATE TRIGGER bump_movie_views_trg AFTER INSERT ON public.movie_view_events
  FOR EACH ROW EXECUTE FUNCTION private.bump_movie_views();

-- ============ drop all permissive policies ============
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename IN ('app_settings','app_users','bot_channels','bot_settings','bot_stats',
               'categories','episodes','live_channels','movies','notifications','push_subscriptions',
               'shop_cart_items','shop_categories','shop_order_items','shop_orders','shop_product_images',
               'shop_products','shop_seller_plans','shop_seller_subscriptions','shop_sellers',
               'slider_items','stories','vip_cards','vip_payments','vip_plans')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============ public catalog: read by everyone, written by admins ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bot_channels','categories','episodes','live_channels','movies',
                           'shop_categories','shop_product_images','shop_seller_plans',
                           'slider_items','stories','vip_cards','vip_plans']
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY "Public can view %1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Admins manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin())', t);
  END LOOP;
END $$;

-- shop_products: admins or the owning seller
GRANT SELECT ON public.shop_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_products TO anon, authenticated;
GRANT ALL ON public.shop_products TO service_role;
CREATE POLICY "Public can view shop_products" ON public.shop_products
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Sellers and admins insert products" ON public.shop_products
  FOR INSERT TO anon, authenticated WITH CHECK (private.is_admin() OR private.owns_seller(seller_id));
CREATE POLICY "Sellers and admins update products" ON public.shop_products
  FOR UPDATE TO anon, authenticated USING (private.is_admin() OR private.owns_seller(seller_id))
  WITH CHECK (private.is_admin() OR private.owns_seller(seller_id));
CREATE POLICY "Sellers and admins delete products" ON public.shop_products
  FOR DELETE TO anon, authenticated USING (private.is_admin() OR private.owns_seller(seller_id));

-- product images may also be managed by the owning seller
CREATE POLICY "Sellers manage own product images" ON public.shop_product_images
  FOR ALL TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id = product_id AND private.owns_seller(p.seller_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shop_products p WHERE p.id = product_id AND private.owns_seller(p.seller_id)));
GRANT INSERT, UPDATE, DELETE ON public.shop_product_images TO anon;

-- ============ admin-only tables ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['app_settings','bot_settings','bot_stats']
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY "Admins manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin())', t);
  END LOOP;
END $$;

-- ============ app_users: own row only, VIP flags admin-only ============
REVOKE ALL ON public.app_users FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.app_users TO anon, authenticated;
GRANT UPDATE (display_name) ON public.app_users TO anon, authenticated;
GRANT ALL ON public.app_users TO service_role;
CREATE POLICY "Own device or admin can view users" ON public.app_users
  FOR SELECT TO anon, authenticated
  USING (device_id = private.current_device_id() OR private.is_admin());
CREATE POLICY "Register own device" ON public.app_users
  FOR INSERT TO anon, authenticated
  WITH CHECK (device_id = private.current_device_id() OR private.is_admin());
CREATE POLICY "Update own device profile" ON public.app_users
  FOR UPDATE TO anon, authenticated
  USING (device_id = private.current_device_id() OR private.is_admin())
  WITH CHECK (device_id = private.current_device_id() OR private.is_admin());
CREATE POLICY "Admins delete users" ON public.app_users
  FOR DELETE TO authenticated USING (private.is_admin());
-- admins need full column update rights for VIP management
GRANT UPDATE ON public.app_users TO authenticated;
REVOKE UPDATE ON public.app_users FROM anon;
GRANT UPDATE (display_name) ON public.app_users TO anon;

-- ============ notifications ============
REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notifications TO service_role;
CREATE POLICY "Own notifications visible" ON public.notifications
  FOR SELECT TO anon, authenticated
  USING (private.owns_app_user(user_id) OR private.is_admin());
CREATE POLICY "Admins create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (private.is_admin());
CREATE POLICY "Own notifications updatable" ON public.notifications
  FOR UPDATE TO anon, authenticated
  USING (private.owns_app_user(user_id) OR private.is_admin())
  WITH CHECK (private.owns_app_user(user_id) OR private.is_admin());
CREATE POLICY "Own notifications deletable" ON public.notifications
  FOR DELETE TO anon, authenticated
  USING (private.owns_app_user(user_id) OR private.is_admin());

-- ============ push_subscriptions ============
REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO anon, authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
CREATE POLICY "Own device push subscriptions" ON public.push_subscriptions
  FOR ALL TO anon, authenticated
  USING (device_id = private.current_device_id() OR private.is_admin())
  WITH CHECK (device_id = private.current_device_id() OR private.is_admin());

-- ============ shop_cart_items ============
REVOKE ALL ON public.shop_cart_items FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_cart_items TO anon, authenticated;
GRANT ALL ON public.shop_cart_items TO service_role;
CREATE POLICY "Own device cart" ON public.shop_cart_items
  FOR ALL TO anon, authenticated
  USING (device_id = private.current_device_id())
  WITH CHECK (device_id = private.current_device_id());

-- ============ shop_orders / shop_order_items ============
REVOKE ALL ON public.shop_orders FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.shop_orders TO anon, authenticated;
GRANT ALL ON public.shop_orders TO service_role;
CREATE POLICY "Own, seller or admin can view orders" ON public.shop_orders
  FOR SELECT TO anon, authenticated
  USING (device_id = private.current_device_id() OR private.owns_seller(seller_id) OR private.is_admin());
CREATE POLICY "Create own order" ON public.shop_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (device_id = private.current_device_id());
CREATE POLICY "Seller or admin update orders" ON public.shop_orders
  FOR UPDATE TO anon, authenticated
  USING (private.owns_seller(seller_id) OR private.is_admin())
  WITH CHECK (private.owns_seller(seller_id) OR private.is_admin());

REVOKE ALL ON public.shop_order_items FROM anon, authenticated;
GRANT SELECT, INSERT ON public.shop_order_items TO anon, authenticated;
GRANT ALL ON public.shop_order_items TO service_role;
CREATE POLICY "Order items follow order visibility" ON public.shop_order_items
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.shop_orders o WHERE o.id = order_id
    AND (o.device_id = private.current_device_id() OR private.owns_seller(o.seller_id) OR private.is_admin())));
CREATE POLICY "Insert items into own order" ON public.shop_order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.shop_orders o WHERE o.id = order_id
    AND (o.device_id = private.current_device_id() OR private.is_admin())));

-- ============ shop_sellers ============
REVOKE ALL ON public.shop_sellers FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.shop_sellers TO anon, authenticated;
GRANT UPDATE (shop_name, description, logo_url, phone, whatsapp, updated_at) ON public.shop_sellers TO anon;
GRANT UPDATE ON public.shop_sellers TO authenticated;
GRANT ALL ON public.shop_sellers TO service_role;
CREATE POLICY "Public can view sellers" ON public.shop_sellers
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Register own seller account" ON public.shop_sellers
  FOR INSERT TO anon, authenticated
  WITH CHECK (device_id = private.current_device_id() OR private.is_admin());
CREATE POLICY "Own seller or admin can update" ON public.shop_sellers
  FOR UPDATE TO anon, authenticated
  USING (device_id = private.current_device_id() OR private.is_admin())
  WITH CHECK (device_id = private.current_device_id() OR private.is_admin());
CREATE POLICY "Admins delete sellers" ON public.shop_sellers
  FOR DELETE TO authenticated USING (private.is_admin());

-- ============ shop_seller_subscriptions ============
REVOKE ALL ON public.shop_seller_subscriptions FROM anon, authenticated;
GRANT SELECT, INSERT ON public.shop_seller_subscriptions TO anon, authenticated;
GRANT UPDATE, DELETE ON public.shop_seller_subscriptions TO authenticated;
GRANT ALL ON public.shop_seller_subscriptions TO service_role;
CREATE POLICY "Own seller or admin views subscriptions" ON public.shop_seller_subscriptions
  FOR SELECT TO anon, authenticated
  USING (private.owns_seller(seller_id) OR private.is_admin());
CREATE POLICY "Own seller submits subscription" ON public.shop_seller_subscriptions
  FOR INSERT TO anon, authenticated
  WITH CHECK (private.owns_seller(seller_id) OR private.is_admin());
CREATE POLICY "Admins review subscriptions" ON public.shop_seller_subscriptions
  FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Admins delete subscriptions" ON public.shop_seller_subscriptions
  FOR DELETE TO authenticated USING (private.is_admin());

-- ============ vip_payments ============
REVOKE ALL ON public.vip_payments FROM anon, authenticated;
GRANT SELECT, INSERT ON public.vip_payments TO anon, authenticated;
GRANT UPDATE, DELETE ON public.vip_payments TO authenticated;
GRANT ALL ON public.vip_payments TO service_role;
CREATE POLICY "Own user or admin views vip payments" ON public.vip_payments
  FOR SELECT TO anon, authenticated
  USING (private.owns_app_user(user_id) OR private.is_admin());
CREATE POLICY "Own user submits vip payment" ON public.vip_payments
  FOR INSERT TO anon, authenticated
  WITH CHECK (private.owns_app_user(user_id) OR private.is_admin());
CREATE POLICY "Admins review vip payments" ON public.vip_payments
  FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "Admins delete vip payments" ON public.vip_payments
  FOR DELETE TO authenticated USING (private.is_admin());

-- ============ storage: public read, uploads allowed, only admins overwrite/delete ============
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public read app buckets" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('posters','screenshots','stories','shop'));
CREATE POLICY "Uploads to shop and screenshots" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id IN ('screenshots','shop'));
CREATE POLICY "Admins upload posters and stories" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('posters','stories','screenshots','shop') AND private.is_admin());
CREATE POLICY "Admins update app files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('posters','screenshots','stories','shop') AND private.is_admin())
  WITH CHECK (bucket_id IN ('posters','screenshots','stories','shop') AND private.is_admin());
CREATE POLICY "Admins delete app files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('posters','screenshots','stories','shop') AND private.is_admin());