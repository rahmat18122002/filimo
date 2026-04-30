import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Lock, Crown, Star, Clock, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { autoRegister, isVip, type AppUser } from "@/lib/userStore";
import { useI18n, getLocalizedField } from "@/lib/i18n";
import { CustomVideoPlayer, type VideoQuality } from "@/components/CustomVideoPlayer";

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  genre: string[];
  description: string;
  poster: string;
  duration: string;
  trailer_url: string | null;
}

interface Episode {
  id: string;
  part_number: number;
  title: string;
  video_url: string | null;
  is_free: boolean;
  duration: string | null;
}

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [selectedEp, setSelectedEp] = useState<Episode | null>(null);
  const [showVipWall, setShowVipWall] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("movies").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setMovie(data as Movie);
      else setNotFound(true);
    });
    supabase.from("episodes").select("*").eq("movie_id", id).order("part_number").then(({ data }) => {
      if (data) setEpisodes(data as Episode[]);
    });
    // Increment view count
    supabase.rpc("increment_movie_views", { movie_id: id }).then(() => {});
    // Auto-register user if not yet registered (for shared links)
    autoRegister().then(setUser).catch(console.error);
  }, [id]);

  const userIsVip = isVip(user);

  // Detects direct video files (mp4/webm/m3u8/mov) — played in native HTML5 <video>
  const isDirectVideo = (url: string): boolean => {
    return /\.(mp4|webm|m3u8|mov|mkv)(\?.*)?$/i.test(url);
  };

  const getDirectVideoQualities = (rawUrl: string): VideoQuality[] => {
    const lines = rawUrl
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines
      .map((line, index) => {
        const match = line.match(/^([^|=]+)[|=](https?:\/\/.+)$/i);
        const src = match ? match[2].trim() : line;
        return isDirectVideo(src) ? { label: match ? match[1].trim() : index === 0 ? "Авто" : `${index + 1}`, src } : null;
      })
      .filter((item): item is VideoQuality => Boolean(item));
  };

  // Detects which provider — needed to apply per-provider masking overlays
  const getProvider = (rawUrl: string): "youtube" | "vk" | "ok" | "dailymotion" | "rutube" | "telegram" | "other" => {
    const url = rawUrl.trim();
    if (/(?:youtube\.com|youtu\.be)/i.test(url)) return "youtube";
    if (/(?:vk\.com|vkvideo\.ru|vk\.ru)/i.test(url)) return "vk";
    if (/ok\.ru/i.test(url)) return "ok";
    if (/(?:dailymotion\.com|dai\.ly)/i.test(url)) return "dailymotion";
    if (/rutube\.ru/i.test(url)) return "rutube";
    if (/^https?:\/\/t\.me\//i.test(url)) return "telegram";
    return "other";
  };

  // Converts a hosted-video URL into a clean embed URL (max-hidden branding)
  const getEmbedUrl = (rawUrl: string): string => {
    const url = rawUrl.trim();

    // ===== YouTube ===== (most aggressive privacy params)
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{6,})/i
    );
    if (ytMatch) {
      const id = ytMatch[1];
      // youtube-nocookie + hide controls/info/related/branding
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&showinfo=0&iv_load_policy=3&fs=1&disablekb=1&controls=1&color=white&playlist=${id}&loop=0`;
    }

    // ===== VK Video =====
    if (/vk\.com\/video_ext\.php/i.test(url)) return url;
    const vkMatch = url.match(/(?:vk\.com|vkvideo\.ru|vk\.ru)\/video(-?\d+)_(\d+)/i);
    if (vkMatch) return `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}&hd=2&autoplay=0&hide_logo=1`;

    // ===== OK.ru =====
    if (/ok\.ru\/videoembed\//i.test(url)) return url;
    const okMatch = url.match(/ok\.ru\/(?:video|live)\/(\d+)/i);
    if (okMatch) return `https://ok.ru/videoembed/${okMatch[1]}?nochat=1&autoplay=0`;

    // ===== Dailymotion ===== (no logo, no info, no share)
    if (/dailymotion\.com\/embed\/video\//i.test(url)) return url;
    const dmMatch = url.match(/(?:dailymotion\.com\/(?:video|hub)\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
    if (dmMatch) return `https://www.dailymotion.com/embed/video/${dmMatch[1]}?ui-logo=0&sharing-enable=0&ui-start-screen-info=0&queue-enable=0&endscreen-enable=0`;

    // ===== Rutube =====
    const rtMatch = url.match(/rutube\.ru\/video\/([\w]+)/i);
    if (rtMatch) return `https://rutube.ru/play/embed/${rtMatch[1]}`;

    // ===== Telegram public post fallback =====
    const tgMatch = url.match(/^https?:\/\/t\.me\/([^/]+)\/(\d+)/i);
    if (tgMatch) return `https://t.me/${tgMatch[1]}/${tgMatch[2]}?embed=1&mode=tme`;

    return url;
  };

  const handleEpisodeClick = (ep: Episode) => {
    if (ep.part_number <= 3 || userIsVip) {
      setSelectedEp(ep);
      setShowVipWall(false);
      // Scroll to player
      setTimeout(() => {
        document.getElementById("episode-player")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      setShowVipWall(true);
      setSelectedEp(null);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <Film className="mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Фильм не найден</h1>
        <p className="text-muted-foreground mb-6">Возможно, ссылка устарела или фильм был удалён</p>
        <Button onClick={() => navigate("/home")} variant="outline">← На главную</Button>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="relative h-[50vh] min-h-[350px] w-full overflow-hidden">
        <img src={movie.poster} alt={movie.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero-overlay" />
        <div className="absolute inset-0 bg-background/50" />
        <div className="absolute left-6 top-6 z-20">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")} className="text-foreground bg-background/30 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="container mx-auto -mt-32 relative z-10 px-6 pb-12">
        <div className="flex flex-col gap-6 md:flex-row">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="shrink-0">
            <img src={movie.poster} alt={movie.title} className="h-72 w-48 rounded-2xl object-cover shadow-card" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              {getLocalizedField(movie, "title", lang)}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>{movie.year}</span>
              <span className="flex items-center gap-1 text-accent"><Star className="h-4 w-4 fill-accent" /> {movie.rating}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {movie.duration}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {movie.genre.map((g) => (
                <span key={g} className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{g}</span>
              ))}
            </div>
            <p className="mt-4 text-muted-foreground leading-relaxed">{getLocalizedField(movie, "description", lang)}</p>
          </motion.div>
        </div>

        {movie.trailer_url && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Трейлер</h2>
            <div className="aspect-video overflow-hidden rounded-2xl bg-secondary">
              <iframe src={movie.trailer_url} className="h-full w-full" allowFullScreen title="Trailer" />
            </div>
          </div>
        )}

        {selectedEp && (
          <motion.div id="episode-player" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Сейчас: {selectedEp.title}</h2>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black relative">
              {selectedEp.video_url ? (
                getDirectVideoQualities(selectedEp.video_url).length > 0 ? (
                  <CustomVideoPlayer
                    qualities={getDirectVideoQualities(selectedEp.video_url)}
                    poster={movie.poster}
                    className="absolute inset-0 h-full w-full"
                  />
                ) : /^https?:\/\/t\.me\//i.test(selectedEp.video_url) ? (
                  // Telegram embed needs masking to hide channel branding
                  <iframe
                    src={getEmbedUrl(selectedEp.video_url)}
                    className="absolute border-0"
                    style={{ top: "-56px", left: "0", width: "100%", height: "calc(100% + 112px)" }}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    title="player"
                  />
                ) : (
                  <>
                    <iframe
                      src={getEmbedUrl(selectedEp.video_url)}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope"
                      allowFullScreen
                      title="player"
                    />
                    <a
                      href={selectedEp.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 z-10 rounded-md bg-background/70 px-2 py-1 text-xs text-foreground backdrop-blur-sm hover:bg-background/90"
                    >
                      Открыть в источнике ↗
                    </a>
                  </>
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Play className="mx-auto mb-2 h-12 w-12" />
                    <p>Видео скоро будет доступно</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {showVipWall && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
            <Crown className="mx-auto mb-3 h-12 w-12 text-accent" />
            <h3 className="text-xl font-bold text-foreground">Требуется VIP-подписка</h3>
            <p className="mt-2 text-muted-foreground">Части 4 и далее доступны только для VIP-пользователей.</p>
            <Button className="mt-4 gap-2" size="lg" onClick={() => navigate("/vip")}><Crown className="h-4 w-4" /> Купить VIP</Button>
          </motion.div>
        )}

        {episodes.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Серии</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {episodes.map((ep) => {
                const locked = ep.part_number > 3 && !userIsVip;
                return (
                  <motion.button
                    key={ep.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEpisodeClick(ep)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                      selectedEp?.id === ep.id ? "border-primary bg-primary/10"
                        : locked ? "border-border/50 bg-secondary/30 opacity-60"
                        : "border-border bg-secondary/50 hover:border-primary/50"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${locked ? "bg-muted" : "bg-primary/20"}`}>
                      {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Play className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{ep.title}</p>
                      {ep.duration && <p className="text-xs text-muted-foreground">{ep.duration}</p>}
                    </div>
                    {locked && <Crown className="h-4 w-4 text-accent shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MovieDetail;
