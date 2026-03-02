import { useState, useEffect, useMemo } from "react";
import { Film, Star, Clock, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeroSlider from "@/components/HeroSlider";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import { categories, type Category } from "@/data/movies";
import { supabase } from "@/integrations/supabase/client";
import { useAutoRegister } from "@/hooks/useAutoRegister";
import { NotificationBell } from "@/components/NotificationBell";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface DBMovie {
  id: string;
  title: string;
  year: number;
  rating: number;
  genre: string[];
  description: string;
  poster: string;
  duration: string;
}

const Index = () => {
  const { user } = useAutoRegister();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("Все");
  const [movies, setMovies] = useState<DBMovie[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("movies")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setMovies(data as DBMovie[]);
      });
  }, []);

  const filtered = useMemo(() => {
    return movies.filter((m) => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "Все" || m.genre.includes(category);
      return matchesSearch && matchesCategory;
    });
  }, [search, category, movies]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute top-0 z-20 w-full">
        <div className="container mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Film className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              КиноПоиск
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user && <NotificationBell userId={user.id} />}
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
              <a href="#catalog" className="transition-colors hover:text-foreground">Каталог</a>
              <a href="#" className="transition-colors hover:text-foreground">Новинки</a>
              <a href="#" className="transition-colors hover:text-foreground">Топ 100</a>
            </nav>
          </div>
        </div>
      </header>

      <HeroSlider />

      {/* Catalog Section */}
      <main id="catalog" className="container mx-auto px-6 py-12">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((movie, i) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -8 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-card">
                  <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-secondary">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span className="text-xs font-semibold text-foreground">{movie.rating}</span>
                  </div>
                </div>
                <div className="mt-3 px-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors flex-1">
                      {movie.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/movie/${movie.id}`;
                        if (navigator.share) {
                          navigator.share({ title: movie.title, text: `Смотри фильм: ${movie.title}`, url });
                        } else {
                          navigator.clipboard.writeText(url);
                          toast({ title: "Ссылка скопирована!" });
                        }
                      }}
                      className="ml-2 shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10"
                      title="Поделиться"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{movie.year}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {movie.duration}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Film className="mb-4 h-12 w-12" />
            <p className="text-lg font-medium">Фильмы не найдены</p>
            <p className="text-sm">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 КиноПоиск — Каталог фильмов
        </div>
      </footer>
    </div>
  );
};

export default Index;
