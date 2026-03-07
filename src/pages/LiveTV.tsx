import { useState, useEffect } from "react";
import { ArrowLeft, Radio, Lock, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAutoRegister } from "@/hooks/useAutoRegister";
import { isVip } from "@/lib/userStore";
import { motion } from "framer-motion";

interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
}

const SPUTNIK_CHANNELS: Channel[] = [
  { id: "gem", name: "Gem TV", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/GEM_TV_logo.svg/1200px-GEM_TV_logo.svg.png", url: "https://d1ds1gsmxwj9cw.cloudfront.net/live/gem-tv/playlist.m3u8", category: "Развлечения" },
  { id: "iran-international", name: "Iran International", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Iran_International_logo.svg/1200px-Iran_International_logo.svg.png", url: "https://d1ds1gsmxwj9cw.cloudfront.net/live/iran-international/playlist.m3u8", category: "Новости" },
  { id: "manoto", name: "Manoto", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Manoto_TV_logo.svg/1200px-Manoto_TV_logo.svg.png", url: "https://d1ds1gsmxwj9cw.cloudfront.net/live/manoto/playlist.m3u8", category: "Развлечения" },
  { id: "bbc-persian", name: "BBC Persian", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/fb/BBC_Persian_logo.svg/1200px-BBC_Persian_logo.svg.png", url: "https://d1ds1gsmxwj9cw.cloudfront.net/live/bbc-persian/playlist.m3u8", category: "Новости" },
  { id: "gem-series", name: "Gem Series", logo: "https://upload.wikimedia.org/wikipedia/en/6/6e/GEM_TV_logo.svg", url: "https://d1ds1gsmxwj9cw.cloudfront.net/live/gem-series/playlist.m3u8", category: "Сериалы" },
  { id: "gem-classic", name: "Gem Classic", logo: "https://upload.wikimedia.org/wikipedia/en/6/6e/GEM_TV_logo.svg", url: "https://d1ds1gsmxwj9cw.cloudfront.net/live/gem-classic/playlist.m3u8", category: "Классика" },
  { id: "gem-kids", name: "Gem Kids", logo: "https://upload.wikimedia.org/wikipedia/en/6/6e/GEM_TV_logo.svg", url: "https://d1ds1gsmxwj9cw.cloudfront.net/live/gem-kids/playlist.m3u8", category: "Детям" },
  { id: "pmc", name: "PMC", logo: "https://upload.wikimedia.org/wikipedia/en/6/6e/GEM_TV_logo.svg", url: "https://d1ds1gsmxwj9cw.cloudfront.net/live/pmc/playlist.m3u8", category: "Музыка" },
];

const LiveTV = () => {
  const { user } = useAutoRegister();
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const userIsVip = isVip(user);

  if (!userIsVip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <Lock className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Только для VIP</h1>
          <p className="text-muted-foreground mb-6">Прямой эфир доступен только для VIP-пользователей</p>
          <button
            onClick={() => navigate("/vip")}
            className="rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Купить VIP
          </button>
          <button
            onClick={() => navigate("/home")}
            className="mt-3 block mx-auto text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← Назад
          </button>
        </motion.div>
      </div>
    );
  }

  const categories = [...new Set(SPUTNIK_CHANNELS.map(c => c.category))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-4 px-6 py-4">
          <button onClick={() => navigate("/home")} className="rounded-full p-2 transition hover:bg-secondary">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="h-5 w-5 text-destructive" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Live TV</h1>
          </div>
        </div>
      </header>

      {/* Player */}
      {selectedChannel && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black"
        >
          <div className="container mx-auto">
            <div className="aspect-video w-full max-w-4xl mx-auto">
              <video
                key={selectedChannel.url}
                controls
                autoPlay
                className="h-full w-full"
                src={selectedChannel.url}
              >
                Ваш браузер не поддерживает видео
              </video>
            </div>
            <div className="px-6 py-3 text-center">
              <p className="text-sm font-semibold text-white">{selectedChannel.name}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Channel Grid */}
      <main className="container mx-auto px-6 py-8">
        {categories.map(cat => (
          <section key={cat} className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-foreground">{cat}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {SPUTNIK_CHANNELS.filter(c => c.category === cat).map((channel, i) => (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedChannel(channel)}
                  className={`cursor-pointer rounded-2xl border p-4 text-center transition-all ${
                    selectedChannel?.id === channel.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-secondary">
                    <Tv className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{channel.name}</p>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default LiveTV;
