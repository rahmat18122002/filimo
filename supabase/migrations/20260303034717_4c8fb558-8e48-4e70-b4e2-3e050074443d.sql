
-- Create categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can manage categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (name, sort_order) VALUES
  ('Боевик', 1),
  ('Комедия', 2),
  ('Драма', 3),
  ('Фантастика', 4),
  ('Триллер', 5),
  ('Ужасы', 6),
  ('Мелодрама', 7);

-- Add carousel_speed setting
INSERT INTO public.app_settings (key, value) VALUES ('carousel_speed', '5') ON CONFLICT DO NOTHING;
