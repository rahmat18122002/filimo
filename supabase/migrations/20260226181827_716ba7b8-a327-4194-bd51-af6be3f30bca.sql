
-- Storage bucket for movie posters
INSERT INTO storage.buckets (id, name, public) VALUES ('posters', 'posters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for posters
CREATE POLICY "Anyone can read posters" ON storage.objects FOR SELECT USING (bucket_id = 'posters');
CREATE POLICY "Anyone can upload posters" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posters');
CREATE POLICY "Anyone can update posters" ON storage.objects FOR UPDATE USING (bucket_id = 'posters');
CREATE POLICY "Anyone can delete posters" ON storage.objects FOR DELETE USING (bucket_id = 'posters');

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notifications" ON public.notifications FOR UPDATE USING (true);

-- Function to notify all users when a new movie is added
CREATE OR REPLACE FUNCTION public.notify_users_new_movie()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, movie_id)
  SELECT id, 'Новый фильм! 🎬', 'Добавлен новый фильм: ' || NEW.title, NEW.id
  FROM public.app_users;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_new_movie_notify
AFTER INSERT ON public.movies
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_new_movie();
