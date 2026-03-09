import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Story {
  id: string;
  title: string;
  image_url: string;
  video_url: string | null;
  movie_id: string | null;
  button_url: string | null;
  button_label: string | null;
  is_active: boolean;
  created_at: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  size: number;
  duration: number;
  color: string;
}

const HEART_COLORS = ["#ff3040", "#ff6b81", "#ff4757", "#e84393", "#fd79a8"];

const FloatingHearts = ({ triggerCount }: { triggerCount: number }) => {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const counterRef = useRef(0);
  const lastTrigger = useRef(0);

  // Spawn burst of hearts when triggerCount changes
  useEffect(() => {
    if (triggerCount <= lastTrigger.current) return;
    lastTrigger.current = triggerCount;
    const burst: FloatingHeart[] = [];
    for (let i = 0; i < 6; i++) {
      burst.push({
        id: counterRef.current++,
        x: 10 + Math.random() * 60,
        size: 18 + Math.random() * 20,
        duration: 1.8 + Math.random() * 1.2,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      });
    }
    setHearts((prev) => [...prev.slice(-20), ...burst]);
  }, [triggerCount]);

  return (
    <div className="absolute bottom-20 right-0 w-28 h-[60%] pointer-events-none z-20 overflow-hidden">
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, y: 0, x: h.x, scale: 0.5 }}
            animate={{
              opacity: [1, 1, 0],
              y: -400,
              x: h.x + (Math.random() - 0.5) * 40,
              scale: [0.5, 1.4, 0.8],
              rotate: (Math.random() - 0.5) * 30,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: h.duration, ease: "easeOut" }}
            onAnimationComplete={() =>
              setHearts((prev) => prev.filter((p) => p.id !== h.id))
            }
            className="absolute bottom-0"
          >
            <Heart
              className="fill-current"
              style={{ color: h.color, width: h.size, height: h.size }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(false);
  const viewedRef = useRef<Set<string>>(new Set());
  const [likeTrigger, setLikeTrigger] = useState(0);
  const navigate = useNavigate();

  const fetchStories = () => {
    supabase
      .from("stories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) {
          const now = Date.now();
          const filtered = (data as Story[]).filter((s) => {
            const created = new Date(s.created_at).getTime();
            return now - created < 24 * 60 * 60 * 1000;
          });
          setStories(filtered);
        }
      });
  };

  useEffect(() => {
    fetchStories();
    const interval = setInterval(fetchStories, 10000);
    return () => clearInterval(interval);
  }, []);

  // Record view when story opens
  const recordView = useCallback(async (storyId: string) => {
    if (viewedRef.current.has(storyId)) return;
    viewedRef.current.add(storyId);
    const deviceId = localStorage.getItem("device_id") || "unknown";
    await supabase.from("story_views").insert({ story_id: storyId, device_id: deviceId });
  }, []);

  useEffect(() => {
    if (viewingIndex !== null && stories[viewingIndex]) {
      recordView(stories[viewingIndex].id);
    }
  }, [viewingIndex, stories, recordView]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    setPaused(false);
    setLikeTrigger(0);
  }, [viewingIndex]);

  const currentStory = viewingIndex !== null ? stories[viewingIndex] : null;
  const isVideo = currentStory?.video_url;

  useEffect(() => {
    if (viewingIndex === null || isVideo) return;
    setProgress(0);
    const duration = 5000;
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      elapsed += interval;
      setProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        if (viewingIndex < stories.length - 1) {
          setViewingIndex(viewingIndex + 1);
        } else {
          setViewingIndex(null);
        }
      }
    }, interval);
    return () => clearInterval(timer);
  }, [viewingIndex, stories.length, isVideo]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (paused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [paused]);

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration) setProgress((currentTime / duration) * 100);
  };

  const handleVideoEnded = () => {
    if (viewingIndex !== null && viewingIndex < stories.length - 1) {
      setViewingIndex(viewingIndex + 1);
    } else {
      setViewingIndex(null);
    }
  };

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaused((p) => !p);
  };

  if (stories.length === 0) return null;

  return (
    <>
      {/* Story circles */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
        {stories.map((story, i) => (
          <motion.button
            key={story.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewingIndex(i)}
            className="flex flex-col items-center gap-0.5 shrink-0"
          >
            <div className="relative h-11 w-11 rounded-full p-[2px] bg-gradient-to-br from-primary via-accent to-destructive">
              <div className="h-full w-full rounded-full overflow-hidden border-[1.5px] border-background">
                <img
                  src={story.image_url}
                  alt={story.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground font-medium line-clamp-1 max-w-[44px] text-center">
              {story.title}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Fullscreen story viewer */}
      {createPortal(
        <AnimatePresence>
          {viewingIndex !== null && stories[viewingIndex] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
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

              {/* Title + controls */}
              <div className="absolute top-6 left-3 right-3 z-10 flex items-center justify-between">
                <p className="text-white text-sm font-semibold truncate flex-1">{stories[viewingIndex].title}</p>
                <div className="flex items-center gap-2">
                  <button onClick={togglePause} className="text-white/70 hover:text-white p-1 transition-colors">
                    {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </button>
                  <button onClick={() => setViewingIndex(null)} className="text-white/70 hover:text-white p-1 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              {stories[viewingIndex].video_url ? (
                <video
                  ref={videoRef}
                  key={viewingIndex}
                  src={stories[viewingIndex].video_url!}
                  autoPlay
                  playsInline
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                  className="h-full w-full object-cover"
                />
              ) : (
                <motion.img
                  key={viewingIndex}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={stories[viewingIndex].image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}

              {/* Floating hearts animation */}
              <FloatingHearts triggerCount={likeTrigger} />

              {/* Like button */}
              <motion.button
                whileTap={{ scale: 1.4 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLikeTrigger((c) => c + 1);
                }}
                className="absolute bottom-10 right-4 z-30 p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-black/50 transition-colors"
              >
                <Heart className="h-7 w-7 text-white fill-red-500" />
              </motion.button>

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

              {/* Bottom button */}
              {(stories[viewingIndex].button_url || stories[viewingIndex].movie_id) && (
                <button
                  onClick={() => {
                    const story = stories[viewingIndex!];
                    if (story.button_url) {
                      window.open(story.button_url, "_blank");
                    } else if (story.movie_id) {
                      setViewingIndex(null);
                      navigate(`/movie/${story.movie_id}`);
                    }
                  }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition-colors"
                >
                  {stories[viewingIndex].button_label || "Подробнее"} →
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Stories;
