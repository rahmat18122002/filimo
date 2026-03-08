import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Story {
  id: string;
  title: string;
  image_url: string;
  video_url: string | null;
  movie_id: string | null;
  is_active: boolean;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("stories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setStories(data as Story[]);
      });
  }, []);

  // Auto-progress when viewing
  useEffect(() => {
    if (viewingIndex === null) return;
    setProgress(0);
    const duration = 5000;
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        // Next story or close
        if (viewingIndex < stories.length - 1) {
          setViewingIndex(viewingIndex + 1);
        } else {
          setViewingIndex(null);
        }
      }
    }, interval);
    return () => clearInterval(timer);
  }, [viewingIndex, stories.length]);

  if (stories.length === 0) return null;

  return (
    <>
      {/* Story circles */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-6 py-4">
        {stories.map((story, i) => (
          <motion.button
            key={story.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewingIndex(i)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="relative h-16 w-16 rounded-full p-[2px] bg-gradient-to-br from-primary via-accent to-destructive">
              <div className="h-full w-full rounded-full overflow-hidden border-2 border-background">
                <img
                  src={story.image_url}
                  alt={story.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium line-clamp-1 max-w-[64px] text-center">
              {story.title}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Fullscreen story viewer */}
      <AnimatePresence>
        {viewingIndex !== null && stories[viewingIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
              {stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{
                      width: i < viewingIndex! ? "100%" : i === viewingIndex ? `${progress}%` : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Title */}
            <div className="absolute top-6 left-3 right-12 z-10">
              <p className="text-white text-sm font-semibold">{stories[viewingIndex].title}</p>
            </div>

            {/* Close */}
            <button
              onClick={() => setViewingIndex(null)}
              className="absolute top-5 right-3 z-10 text-white p-1"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Content */}
            <motion.img
              key={viewingIndex}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={stories[viewingIndex].image_url}
              alt=""
              className="h-full w-full object-cover"
            />

            {/* Navigate left/right */}
            <button
              onClick={() => setViewingIndex(Math.max(0, viewingIndex - 1))}
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            />
            <button
              onClick={() => {
                if (viewingIndex < stories.length - 1) {
                  setViewingIndex(viewingIndex + 1);
                } else {
                  setViewingIndex(null);
                }
              }}
              className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            />

            {/* Go to movie */}
            {stories[viewingIndex].movie_id && (
              <button
                onClick={() => {
                  setViewingIndex(null);
                  navigate(`/movie/${stories[viewingIndex!].movie_id}`);
                }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black"
              >
                Смотреть →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Stories;
