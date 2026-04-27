import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SliderItem {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  movie_id: string | null;
}

const HeroSlider = () => {
  const [items, setItems] = useState<SliderItem[]>([]);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("slider_items")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setItems(data as SliderItem[]);
      });
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, items.length]);

  if (items.length === 0) return null;

  const item = items[current];

  return (
    <section className="relative w-full p-[2px] rounded-2xl overflow-hidden hero-slider-glow">
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-2xl hero-border-anim" aria-hidden="true" />

      <div className="relative w-full overflow-hidden rounded-2xl bg-background" style={{ aspectRatio: "16 / 9" }}>
      <AnimatePresence mode="wait">
        <motion.img
          key={item.id}
          src={item.image_url}
          alt={item.title}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "brightness(1.1) saturate(1.15) contrast(1.05)" }}
        />
      </AnimatePresence>
      {/* Light bottom-only gradient so text stays readable but image stays bright */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />

      <div className="relative z-10 flex h-full items-end pb-6 sm:pb-10 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            key={item.id + "-text"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="mb-2 sm:mb-4 flex items-center gap-3">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-primary-foreground">
                Популярное
              </span>
            </div>
            <h1 className="mb-2 sm:mb-4 text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground line-clamp-2">
              {item.title}
            </h1>
            {item.subtitle && (
              <p className="mb-3 sm:mb-6 max-w-lg text-xs sm:text-sm md:text-lg text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
                {item.subtitle}
              </p>
            )}
            {item.movie_id && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/movie/${item.movie_id}`)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 sm:px-8 sm:py-3.5 text-sm sm:text-base font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-primary-foreground" />
                Смотреть
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/50 p-2 text-foreground backdrop-blur-sm transition hover:bg-background/80"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/50 p-2 text-foreground backdrop-blur-sm transition hover:bg-background/80"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-8 bg-primary" : "w-2 bg-foreground/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
      </div>
    </section>
  );
};

export default HeroSlider;
