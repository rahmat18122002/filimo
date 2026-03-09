import { motion } from "framer-motion";
import { Star, Clock, Share2 } from "lucide-react";
import type { Movie } from "@/data/movies";
import { toast } from "sonner";

interface MovieCardProps {
  movie: Movie;
  index: number;
}

const MovieCard = ({ movie, index }: MovieCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-xl shadow-card">
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={movie.poster}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 right-0 translate-y-4 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {movie.description}
          </p>
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 backdrop-blur-sm">
          <Star className="h-3 w-3 fill-accent text-accent" />
          <span className="text-xs font-semibold text-foreground">{movie.rating}</span>
        </div>
      </div>

      <div className="mt-3 px-1">
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{movie.year}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {movie.duration}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {movie.genre.slice(0, 2).map((g) => (
            <span
              key={g}
              className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
