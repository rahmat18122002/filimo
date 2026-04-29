import { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import {
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  RotateCw,
  Loader2,
} from "lucide-react";

export interface VideoQuality {
  label: string; // e.g. "1080p", "720p", "Auto"
  src: string;
}

interface CustomVideoPlayerProps {
  /** Single source URL — used when no qualities array is provided */
  src?: string;
  /** Optional list of quality variants (e.g., [{label:'1080p', src:'...'}]) */
  qualities?: VideoQuality[];
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

type WebkitVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

export const CustomVideoPlayer = ({
  src,
  qualities,
  poster,
  autoPlay = true,
  className = "",
}: CustomVideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  const qualityList: VideoQuality[] =
    qualities && qualities.length > 0
      ? qualities
      : src
      ? [{ label: "Авто", src }]
      : [];

  const [currentQuality, setCurrentQuality] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  const activeSrc = qualityList[currentQuality]?.src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    setLoading(true);

    let hls: Hls | null = null;
    const isHlsSource = /\.m3u8(?:\?.*)?$/i.test(activeSrc);

    if (isHlsSource && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(activeSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });
    } else {
      video.src = activeSrc;
      video.load();
      if (autoPlay) {
        const playWhenReady = () => video.play().catch(() => {});
        video.addEventListener("canplay", playWhenReady, { once: true });
      }
    }

    return () => {
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSrc, autoPlay]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (playing && !showSettings) setShowControls(false);
    }, 3000);
  }, [playing, showSettings]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Quality switch — preserve playback position
  const switchQuality = (idx: number) => {
    const v = videoRef.current;
    if (!v) return;
    const time = v.currentTime;
    const wasPlaying = !v.paused;
    setCurrentQuality(idx);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        if (wasPlaying) videoRef.current.play().catch(() => {});
      }
    }, 100);
    setShowSettings(false);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const skip = (sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + sec), v.duration || 0);
    resetHideTimer();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else {
        (videoRef.current as WebkitVideoElement | null)?.webkitEnterFullscreen?.();
      }
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  if (!activeSrc) {
    return (
      <div className={`flex items-center justify-center bg-black text-muted-foreground ${className}`}>
        Видео недоступно
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden group select-none ${className}`}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video
        ref={videoRef}
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        className="absolute inset-0 h-full w-full"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-12 w-12 animate-spin text-white/80" />
        </div>
      )}

      {/* Custom controls — only skip ±10s, quality and fullscreen */}
      <div
        className={`absolute top-3 right-3 z-10 flex items-center gap-2 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={() => skip(-10)}
          className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
          aria-label="-10s"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <button
          onClick={() => skip(10)}
          className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
          aria-label="+10s"
        >
          <RotateCw className="h-5 w-5" />
        </button>

        {/* Quality settings */}
        {qualityList.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
              aria-label="Quality"
            >
              <Settings className="h-5 w-5" />
            </button>

            {showSettings && (
              <div className="absolute top-12 right-0 min-w-[140px] rounded-lg bg-black/90 backdrop-blur-md border border-white/10 text-sm overflow-hidden text-white">
                <div className="px-4 py-2 text-white/60 text-xs border-b border-white/10">
                  Качество
                </div>
                {qualityList.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => switchQuality(i)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 hover:bg-white/10 ${
                      i === currentQuality ? "text-primary" : ""
                    }`}
                  >
                    {q.label}
                    {i === currentQuality && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
          aria-label="Fullscreen"
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
