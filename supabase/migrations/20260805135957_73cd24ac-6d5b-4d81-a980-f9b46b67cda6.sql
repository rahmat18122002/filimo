
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS balance integer NOT NULL DEFAULT 0;

CREATE TABLE public.balance_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 0,
  approved_amount integer,
  screenshot_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.balance_topups TO anon, authenticated;
GRANT UPDATE, DELETE ON public.balance_topups TO authenticated;
GRANT ALL ON public.balance_topups TO service_role;

ALTER TABLE public.balance_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own user or admin views topups" ON public.balance_topups
  FOR SELECT TO anon, authenticated
  USING (private.owns_app_user(user_id) OR private.is_admin());

CREATE POLICY "Own user submits topup" ON public.balance_topups
  FOR INSERT TO anon, authenticated
  WITH CHECK (private.owns_app_user(user_id) OR private.is_admin());

CREATE POLICY "Admins review topups" ON public.balance_topups
  FOR UPDATE TO authenticated
  USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "Admins delete topups" ON public.balance_topups
  FOR DELETE TO authenticated
  USING (private.is_admin());

CREATE OR REPLACE FUNCTION private.protect_app_user_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF private.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.balance := OLD.balance;
  NEW.is_vip := OLD.is_vip;
  NEW.vip_until := OLD.vip_until;
  NEW.device_id := OLD.device_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_app_user_fields_trg ON public.app_users;
CREATE TRIGGER protect_app_user_fields_trg
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION private.protect_app_user_fields();
