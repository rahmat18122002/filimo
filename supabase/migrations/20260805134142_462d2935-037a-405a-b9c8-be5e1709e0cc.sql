DROP FUNCTION IF EXISTS public.claim_admin_if_unclaimed();

CREATE OR REPLACE FUNCTION private.no_admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin');
$$;
REVOKE ALL ON FUNCTION private.no_admin_exists() FROM public;
GRANT EXECUTE ON FUNCTION private.no_admin_exists() TO authenticated, service_role;

GRANT INSERT ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "Bootstrap first admin" ON public.user_roles;
CREATE POLICY "Bootstrap first admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'admin' AND private.no_admin_exists());