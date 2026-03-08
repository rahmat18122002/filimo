import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Film, Star, Clock, Share2, ChevronLeft, ChevronRight, Crown, Radio, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isVip } from "@/lib/userStore";
import HeroSlider from "@/components/HeroSlider";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { useAutoRegister } from "@/hooks/useAutoRegister";
import { NotificationBell } from "@/components/NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import Stories from "@/components/Stories";
import { useI18n, LANGUAGES, getLocalizedField } from "@/lib/i18n";

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

const MovieCarousel = ({ movies, carouselSpeed, lang }: { movies: DBMovie[]; carouselSpeed: number; lang: string }) => {
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
    if (movies.length < 2 || carouselSpeed <= 0) return;
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
          if (movies.length < 2 || carouselSpeed <= 0) return;
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
                  {getLocalizedField(movie, "title", lang)}
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
  const { t, lang, setLang, dir } = useI18n();
  const [search, setSearch] = useState("");
  const [movies, setMovies] = useState<DBMovie[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [carouselSpeed, setCarouselSpeed] = useState(5);
  const [appName, setAppName] = useState("Filimo");
  const [showLangPicker, setShowLangPicker] = useState(false);
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
    supabase.from("app_settings").select("*").eq("key", "app_name").single().then(({ data }) => {
      if (data) setAppName((data as any).value || "Filimo");
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
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header with Stories inline */}
      <header className="relative z-20 w-full bg-background">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <Film className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {appName}
            </span>
          </div>
          {/* Stories circles inline */}
          <div className="flex-1 min-w-0">
            <Stories />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user && <NotificationBell userId={user.id} />}
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
              <p className="text-lg font-medium">{t("movies.not_found")}</p>
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
                  {t("movies.all")}
                </h2>
                <MovieCarousel movies={movies} carouselSpeed={carouselSpeed} />
              </section>
            )}

            {movies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Film className="mb-4 h-12 w-12" />
                <p className="text-lg font-medium">{t("movies.not_found")}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 pb-24">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          {t("footer.copyright")}
        </div>
      </footer>

      {/* Language picker popup */}
      <AnimatePresence>
        {showLangPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] bg-background border border-border rounded-2xl shadow-xl p-3 min-w-[200px]"
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setShowLangPicker(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  lang === l.code ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
        <div className="flex items-center justify-around px-4 py-3">
          {/* VIP Button */}
          <motion.button
            onClick={() => navigate("/vip")}
            className="flex flex-col items-center gap-1"
            whileTap={{ scale: 0.9 }}
          >
            <div className={`rounded-full p-2.5 ${user && isVip(user) ? "bg-accent/20" : "bg-secondary"}`}>
              <Crown className={`h-5 w-5 ${user && isVip(user) ? "text-accent" : "text-muted-foreground"}`} />
            </div>
            <span className={`text-[10px] font-bold ${user && isVip(user) ? "text-accent" : "text-muted-foreground"}`}>
              {user && isVip(user) && user.vip_until
                ? `VIP — ${Math.max(0, Math.ceil((new Date(user.vip_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}`
                : user && isVip(user)
                ? "VIP ∞"
                : t("nav.vip")}
            </span>
          </motion.button>

          {/* Home Button */}
          <motion.button
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex flex-col items-center gap-1"
            whileTap={{ scale: 0.9 }}
          >
            <div className="rounded-full bg-primary/10 p-2.5">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-primary">{t("nav.home")}</span>
          </motion.button>

          {/* Live TV Button */}
          <motion.button
            onClick={() => {
              if (user && isVip(user)) {
                navigate("/live");
              } else {
                navigate("/vip");
                toast({ title: t("vip.only"), description: t("vip.buy") });
              }
            }}
            className="flex flex-col items-center gap-1"
            whileTap={{ scale: 0.9 }}
          >
            <div className={`relative rounded-full p-2.5 ${user && isVip(user) ? "bg-destructive/15" : "bg-secondary"}`}>
              <Radio className={`h-5 w-5 ${user && isVip(user) ? "text-destructive" : "text-muted-foreground"}`} />
              {user && isVip(user) && (
                <span className="absolute right-1 top-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold ${user && isVip(user) ? "text-destructive" : "text-muted-foreground"}`}>{t("nav.live")}</span>
          </motion.button>

          {/* Language Button */}
          <motion.button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex flex-col items-center gap-1"
            whileTap={{ scale: 0.9 }}
          >
            <div className={`rounded-full p-2.5 ${showLangPicker ? "bg-primary/10" : "bg-secondary"}`}>
              <Globe className={`h-5 w-5 ${showLangPicker ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <span className={`text-[10px] font-bold ${showLangPicker ? "text-primary" : "text-muted-foreground"}`}>
              {LANGUAGES.find((l) => l.code === lang)?.flag || "🌐"}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Index;
