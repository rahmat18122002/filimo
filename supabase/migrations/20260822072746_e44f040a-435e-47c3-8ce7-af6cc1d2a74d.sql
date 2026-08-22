CREATE TABLE public.telegram_admins (
  chat_id text PRIMARY KEY,
  username text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_admins TO authenticated;
GRANT ALL ON public.telegram_admins TO service_role;
ALTER TABLE public.telegram_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage telegram admins" ON public.telegram_admins FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.telegram_sessions (
  chat_id text PRIMARY KEY,
  movie_id uuid REFERENCES public.movies(id) ON DELETE SET NULL,
  step text NOT NULL DEFAULT 'idle',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_sessions TO authenticated;
GRANT ALL ON public.telegram_sessions TO service_role;
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage telegram sessions" ON public.telegram_sessions FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));