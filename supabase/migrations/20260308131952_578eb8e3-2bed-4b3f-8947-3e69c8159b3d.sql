
-- Allow deleting app_users
CREATE POLICY "Anyone can delete app_users" ON public.app_users FOR DELETE USING (true);

-- Allow deleting vip_payments
CREATE POLICY "Anyone can delete vip_payments" ON public.vip_payments FOR DELETE USING (true);
