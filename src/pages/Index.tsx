import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Film, Star, Clock, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeroSlider from "@/components/HeroSlider";
import SearchBar from "@/components/SearchBar";
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

interface DBCategory {
  id: string;
  name: string;
  sort_order: number;
}

const MovieCarousel = ({ movies, carouselSpeed }: { movies: DBMovie[]; carouselSpeed: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout>();

  const scroll = useCallback((dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  // Auto-scroll right to left
  useEffect(() => {
    if (movies.length <= 3 || carouselSpeed <= 0) return;
    intervalRef.current = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
      }
    }, carouselSpeed * 1000);
    return () => clearInterval(intervalRef.current);
  }, [movies.length, carouselSpeed]);

  return (
    <div className="group/carousel relative">
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-lg backdrop-blur-sm opacity-0 transition group-hover/carousel:opacity-100"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-2"
        onMouseEnter={() => clearInterval(intervalRef.current)}
        onMouseLeave={() => {
          if (movies.length <= 3 || carouselSpeed <= 0) return;
          intervalRef.current = setInterval(() => {
            if (!scrollRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 10) {
              scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
            } else {
              scrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
            }
          }, carouselSpeed * 1000);
        }}
      >
        {movies.map((movie, i) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -8 }}
            className="group cursor-pointer shrink-0 w-[180px] sm:w-[200px]"
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
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
                  onClick={async (e) => {
                    e.stopPropagation();
                    const url = `${window.location.origin}/movie/${movie.id}`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: movie.title, text: `Смотри фильм: ${movie.title}`, url });
                      } else {
                        await navigator.clipboard.writeText(url);
                        toast({ title: "Ссылка скопирована!" });
                      }
                    } catch {
                      try {
                        await navigator.clipboard.writeText(url);
                        toast({ title: "Ссылка скопирована!" });
                      } catch {
                        toast({ title: "Ссылка", description: url });
                      }
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
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow-lg backdrop-blur-sm opacity-0 transition group-hover/carousel:opacity-100"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

const Index = () => {
  const { user } = useAutoRegister();
  const [search, setSearch] = useState("");
  const [movies, setMovies] = useState<DBMovie[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [carouselSpeed, setCarouselSpeed] = useState(5);
  const navigate = useNavigate();

  const loadData = useCallback(() => {
    supabase.from("movies").select("*").order("sort_order").then(({ data }) => {
      if (data) setMovies(data as DBMovie[]);
    });
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      if (data) setCategories(data as DBCategory[]);
    });
    supabase.from("app_settings").select("*").eq("key", "carousel_speed").single().then(({ data }) => {
      if (data) setCarouselSpeed(Number((data as any).value) || 5);
    });
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, [loadData]);

  const searchFiltered = useMemo(() => {
    if (!search) return movies;
    return movies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
  }, [search, movies]);

  const moviesByCategory = useMemo(() => {
    return categories.map((cat) => ({
      category: cat,
      movies: searchFiltered.filter((m) => m.genre.includes(cat.name)),
    })).filter((g) => g.movies.length > 0);
  }, [categories, searchFiltered]);

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
        </div>

        {/* All movies grid when searching */}
        {search && (
          searchFiltered.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {searchFiltered.map((movie, i) => (
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
                        <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><Film className="h-10 w-10 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span className="text-xs font-semibold text-foreground">{movie.rating}</span>
                    </div>
                  </div>
                  <div className="mt-3 px-1">
                    <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1">{movie.title}</h3>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{movie.year}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{movie.duration}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Film className="mb-4 h-12 w-12" />
              <p className="text-lg font-medium">Фильмы не найдены</p>
            </div>
          )
        )}

        {/* Category carousels when not searching */}
        {!search && (
          <div className="space-y-10">
            {moviesByCategory.map(({ category, movies: catMovies }) => (
              <section key={category.id}>
                <h2 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {category.name}
                </h2>
                <MovieCarousel movies={catMovies} carouselSpeed={carouselSpeed} />
              </section>
            ))}

            {moviesByCategory.length === 0 && movies.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Все фильмы
                </h2>
                <MovieCarousel movies={movies} carouselSpeed={carouselSpeed} />
              </section>
            )}

            {movies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Film className="mb-4 h-12 w-12" />
                <p className="text-lg font-medium">Фильмы не найдены</p>
              </div>
            )}
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
