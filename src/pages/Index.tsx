import { useState, useMemo } from "react";
import { Film } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import MovieCard from "@/components/MovieCard";
import { movies, type Category } from "@/data/movies";

const Index = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("Все");

  const filtered = useMemo(() => {
    return movies.filter((m) => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "Все" || m.genre.includes(category);
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

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
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#" className="transition-colors hover:text-foreground">Каталог</a>
            <a href="#" className="transition-colors hover:text-foreground">Новинки</a>
            <a href="#" className="transition-colors hover:text-foreground">Топ 100</a>
          </nav>
        </div>
      </header>

      <HeroSection />

      {/* Catalog Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
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
