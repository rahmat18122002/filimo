
-- App users (auto-registered visitors)
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  vip_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app_users" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert app_users" ON public.app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update app_users" ON public.app_users FOR UPDATE USING (true);

-- Movies table
CREATE TABLE public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  year INT NOT NULL DEFAULT 2024,
  rating NUMERIC(3,1) NOT NULL DEFAULT 0,
  genre TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  poster TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  trailer_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert movies" ON public.movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update movies" ON public.movies FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete movies" ON public.movies FOR DELETE USING (true);

-- Episodes per movie
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
  part_number INT NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(movie_id, part_number)
);
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read episodes" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert episodes" ON public.episodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update episodes" ON public.episodes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete episodes" ON public.episodes FOR DELETE USING (true);

-- Slider items for hero carousel
CREATE TABLE public.slider_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  movie_id UUID REFERENCES public.movies(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.slider_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read slider_items" ON public.slider_items FOR SELECT USING (true);
CREATE POLICY "Anyone can manage slider_items" ON public.slider_items FOR ALL USING (true);

-- Seed movies from existing data
INSERT INTO public.movies (title, year, rating, genre, description, poster, duration, is_featured, sort_order) VALUES
('Бегущий по лезвию 2049', 2017, 8.0, ARRAY['Фантастика','Драма','Триллер'], 'Новый офицер полиции Лос-Анджелеса обнаруживает тайну, которая может погрузить в хаос то, что осталось от общества.', 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=600&fit=crop', '2ч 44м', true, 1),
('Начало', 2010, 8.8, ARRAY['Фантастика','Боевик','Триллер'], 'Вор, который крадёт корпоративные секреты с помощью технологии внедрения в сны, получает задание внедрить идею.', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop', '2ч 28м', true, 2),
('Паразиты', 2019, 8.5, ARRAY['Драма','Триллер','Комедия'], 'Жадность и классовая дискриминация угрожают вновь обретённому симбиозу между богатой семьёй Пак и бедным кланом Ким.', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop', '2ч 12м', false, 3),
('Интерстеллар', 2014, 8.7, ARRAY['Фантастика','Драма'], 'Команда исследователей путешествует через червоточину в космосе в попытке обеспечить выживание человечества.', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop', '2ч 49м', true, 4),
('Джон Уик', 2014, 7.4, ARRAY['Боевик','Триллер'], 'Бывший наёмный убийца выходит из отставки, чтобы отомстить гангстерам, которые отняли у него всё.', 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop', '1ч 41м', false, 5),
('Великий Гэтсби', 2013, 7.2, ARRAY['Драма','Мелодрама'], 'Писатель и мечтатель Ник Каррауэй прибывает в Нью-Йорк 1922 года и становится соседом загадочного миллионера.', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop', '2ч 23м', false, 6),
('Тихое место', 2018, 7.5, ARRAY['Ужасы','Триллер','Драма'], 'Семья живёт в тишине, скрываясь от существ, которые охотятся по звуку.', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop', '1ч 30м', false, 7),
('Безумный Макс: Дорога ярости', 2015, 8.1, ARRAY['Боевик','Фантастика'], 'В постапокалиптическом мире женщина восстаёт против тиранического правителя в поисках свободы.', 'https://images.unsplash.com/photo-1518676590747-1e3dcf5a4953?w=400&h=600&fit=crop', '2ч 00м', false, 8),
('Ла-Ла Ленд', 2016, 8.0, ARRAY['Мелодрама','Комедия','Драма'], 'Джазовый пианист и начинающая актриса влюбляются друг в друга, пытаясь осуществить свои мечты в Лос-Анджелесе.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop', '2ч 08м', false, 9),
('Дюна', 2021, 8.0, ARRAY['Фантастика','Драма','Боевик'], 'Пол Атрейдес, блестящий и одарённый молодой человек, должен отправиться на самую опасную планету во вселенной.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop', '2ч 35м', true, 10),
('Мстители: Финал', 2019, 8.4, ARRAY['Боевик','Фантастика','Драма'], 'После разрушительных событий оставшиеся Мстители должны собраться вновь, чтобы обратить действия Таноса.', 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=600&fit=crop', '3ч 01м', false, 11),
('Побег из Шоушенка', 1994, 9.3, ARRAY['Драма'], 'Два заключённых находят утешение и искупление за долгие годы заключения через акты простой порядочности.', 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400&h=600&fit=crop', '2ч 22м', true, 12);

-- Seed some episodes
INSERT INTO public.episodes (movie_id, part_number, title, is_free, duration)
SELECT m.id, ep.part, ep.title, ep.part <= 3, ep.dur
FROM public.movies m
CROSS JOIN (VALUES
  (1, 'Часть 1', '45м'),
  (2, 'Часть 2', '42м'),
  (3, 'Часть 3', '48м'),
  (4, 'Часть 4', '44м'),
  (5, 'Часть 5', '46м')
) AS ep(part, title, dur)
WHERE m.title IN ('Начало', 'Интерстеллар', 'Дюна', 'Мстители: Финал');

-- Seed slider items from featured movies
INSERT INTO public.slider_items (title, subtitle, image_url, movie_id, sort_order)
SELECT m.title, m.description, m.poster, m.id, m.sort_order
FROM public.movies m WHERE m.is_featured = true;
