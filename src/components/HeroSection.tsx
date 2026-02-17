import { motion } from "framer-motion";
import { Play, Star } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      <img
        src={heroBg}
        alt="Cinema hero"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-hero-overlay" />
      <div className="absolute inset-0 bg-background/40" />

      <div className="relative z-10 flex h-full items-end pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Популярное
              </span>
              <span className="flex items-center gap-1 text-accent text-sm font-medium">
                <Star className="h-4 w-4 fill-accent" />
                8.8
              </span>
            </div>
            <h1 className="mb-4 text-5xl font-bold leading-tight text-foreground md:text-6xl">
              Откройте мир{" "}
              <span className="text-gradient-hero">кино</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg text-muted-foreground leading-relaxed">
              Исследуйте коллекцию лучших фильмов всех времён. Находите новые шедевры и классику кинематографа.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
            >
              <Play className="h-5 w-5 fill-primary-foreground" />
              Смотреть подборку
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
