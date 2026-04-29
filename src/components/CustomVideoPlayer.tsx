import { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
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

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [settingsView, setSettingsView] = useState<"main" | "quality" | "speed">("main");

  const activeSrc = qualityList[currentQuality]?.src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    setLoading(true);
    setProgress(0);
    setBuffered(0);

    let hls: Hls | null = null;
    const isHlsSource = /\.m3u8(?:\?.*)?$/i.test(activeSrc);

    if (isHlsSource && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(activeSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.playbackRate = speed;
        if (autoPlay) video.play().catch(() => {});
      });
    } else {
      video.src = activeSrc;
      video.load();
      video.playbackRate = speed;
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
    // activeSrc change must reload the media; speed changes are handled separately.
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
    // Effect after src change:
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        if (wasPlaying) videoRef.current.play().catch(() => {});
      }
    }, 100);
    setShowSettings(false);
    setSettingsView("main");
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  const seek = (val: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = (val / 100) * duration;
  };

  const skip = (sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + sec), duration || v.duration || 0);
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

  const setPlaybackSpeed = (s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSettings(false);
    setSettingsView("main");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          skip(-10);
          break;
        case "ArrowRight":
          skip(10);
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

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
      onClick={(e) => {
        // Click on background area toggles controls; ignore clicks on buttons
        if (e.target === e.currentTarget) resetHideTimer();
      }}
    >
      <video
        ref={videoRef}
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        className="absolute inset-0 h-full w-full"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setLoading(false);
        }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setProgress((v.currentTime / (v.duration || 1)) * 100);
          if (v.buffered.length > 0) {
            setBuffered((v.buffered.end(v.buffered.length - 1) / (v.duration || 1)) * 100);
          }
        }}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-12 w-12 animate-spin text-white/80" />
        </div>
      )}

      {/* Center play/pause big button (mobile) */}
      {!playing && !loading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <Play className="h-10 w-10 fill-white text-white ml-1" />
          </span>
        </button>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top gradient + double-tap zones for skip */}
        <div className="absolute inset-x-0 -top-32 h-32 bg-gradient-to-b from-transparent to-black/70 pointer-events-none" />

        {/* Progress bar */}
        <div className="px-3 pb-1">
          <div className="relative h-1.5 w-full rounded-full bg-white/20 cursor-pointer group/bar"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const pct = ((e.clientX - rect.left) / rect.width) * 100;
                 seek(pct);
               }}
          >
            {/* Buffered */}
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${buffered}%` }} />
            {/* Progress */}
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }} />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary opacity-0 group-hover/bar:opacity-100 transition-opacity"
              style={{ left: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-2 px-3 pb-3 pt-1 text-white">
          <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-full" aria-label="Play/Pause">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <button onClick={() => skip(-10)} className="p-2 hover:bg-white/10 rounded-full" aria-label="-10s">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button onClick={() => skip(10)} className="p-2 hover:bg-white/10 rounded-full" aria-label="+10s">
            <RotateCw className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full" aria-label="Mute">
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolume(Number(e.target.value))}
              className="w-20 accent-primary"
            />
          </div>

          <span className="text-xs tabular-nums ml-1">
            {formatTime((progress / 100) * duration)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            {/* Mobile mute */}
            <button onClick={toggleMute} className="sm:hidden p-2 hover:bg-white/10 rounded-full" aria-label="Mute">
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettings((s) => !s);
                  setSettingsView("main");
                }}
                className="p-2 hover:bg-white/10 rounded-full"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              {showSettings && (
                <div className="absolute bottom-12 right-0 min-w-[180px] rounded-lg bg-black/90 backdrop-blur-md border border-white/10 text-sm overflow-hidden">
                  {settingsView === "main" && (
                    <>
                      <button
                        onClick={() => setSettingsView("quality")}
                        className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-white/10"
                      >
                        <span>Качество</span>
                        <span className="text-white/60 text-xs">{qualityList[currentQuality]?.label}</span>
                      </button>
                      <button
                        onClick={() => setSettingsView("speed")}
                        className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-white/10"
                      >
                        <span>Скорость</span>
                        <span className="text-white/60 text-xs">{speed}x</span>
                      </button>
                    </>
                  )}
                  {settingsView === "quality" && (
                    <>
                      <button
                        onClick={() => setSettingsView("main")}
                        className="px-4 py-2 text-white/60 text-xs hover:bg-white/10 w-full text-left border-b border-white/10"
                      >
                        ← Качество
                      </button>
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
                    </>
                  )}
                  {settingsView === "speed" && (
                    <>
                      <button
                        onClick={() => setSettingsView("main")}
                        className="px-4 py-2 text-white/60 text-xs hover:bg-white/10 w-full text-left border-b border-white/10"
                      >
                        ← Скорость
                      </button>
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setPlaybackSpeed(s)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 hover:bg-white/10 ${
                            s === speed ? "text-primary" : ""
                          }`}
                        >
                          {s === 1 ? "Обычная" : `${s}x`}
                          {s === speed && <span>✓</span>}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full" aria-label="Fullscreen">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
