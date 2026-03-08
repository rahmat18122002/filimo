import { useState, useEffect } from "react";
import { Film, Plus, Pencil, Trash2, Search, ListVideo, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  is_featured: boolean;
}

interface Episode {
  id: string;
  movie_id: string;
  part_number: number;
  title: string;
  video_url: string | null;
  is_free: boolean;
  duration: string | null;
}

const MoviesAdmin = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editMovie, setEditMovie] = useState<Movie | null>(null);
  const [form, setForm] = useState({ title: "", title_en: "", title_tg: "", title_fa: "", year: "", rating: "", genre: "", description: "", description_en: "", description_tg: "", description_fa: "", poster: "", duration: "", trailer_url: "", is_featured: false });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Episodes
  const [epOpen, setEpOpen] = useState(false);
  const [epMovie, setEpMovie] = useState<Movie | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [epForm, setEpForm] = useState({ part_number: "", title: "", video_url: "", is_free: true, duration: "" });

  const loadMovies = () => {
    supabase.from("movies").select("*").order("sort_order").then(({ data }) => {
      if (data) setMovies(data as Movie[]);
    });
  };

  useEffect(() => { loadMovies(); }, []);

  const filtered = movies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => {
    setEditMovie(null);
    setForm({ title: "", year: "", rating: "", genre: "", description: "", poster: "", duration: "", trailer_url: "", is_featured: false });
    setIsOpen(true);
  };

  const openEdit = (m: Movie) => {
    setEditMovie(m);
    setForm({
      title: m.title, year: String(m.year), rating: String(m.rating),
      genre: m.genre.join(", "), description: m.description, poster: m.poster,
      duration: m.duration, trailer_url: m.trailer_url || "", is_featured: m.is_featured,
    });
    setIsOpen(true);
  };

  const uploadPoster = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("posters").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("posters").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      let posterUrl = form.poster;
      if (posterFile) {
        posterUrl = await uploadPoster(posterFile);
      }
      const payload = {
        title: form.title, year: Number(form.year) || 2024, rating: Number(form.rating) || 0,
        genre: form.genre.split(",").map((g) => g.trim()),
        description: form.description, poster: posterUrl, duration: form.duration,
        trailer_url: form.trailer_url || null, is_featured: form.is_featured,
      };
      if (editMovie) {
        await supabase.from("movies").update(payload).eq("id", editMovie.id);
        toast({ title: "Фильм обновлён" });
      } else {
        await supabase.from("movies").insert(payload);
        toast({ title: "Фильм добавлен" });
      }
      setIsOpen(false);
      setPosterFile(null);
      loadMovies();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("movies").delete().eq("id", id);
    toast({ title: "Фильм удалён", variant: "destructive" });
    loadMovies();
  };

  // Episodes management
  const openEpisodes = async (m: Movie) => {
    setEpMovie(m);
    const { data } = await supabase.from("episodes").select("*").eq("movie_id", m.id).order("part_number");
    setEpisodes((data || []) as Episode[]);
    setEpOpen(true);
  };

  const addEpisode = async () => {
    if (!epMovie) return;
    await supabase.from("episodes").insert({
      movie_id: epMovie.id,
      part_number: Number(epForm.part_number),
      title: epForm.title,
      video_url: epForm.video_url || null,
      is_free: epForm.is_free,
      duration: epForm.duration || null,
    });
    const { data } = await supabase.from("episodes").select("*").eq("movie_id", epMovie.id).order("part_number");
    setEpisodes((data || []) as Episode[]);
    setEpForm({ part_number: "", title: "", video_url: "", is_free: true, duration: "" });
    toast({ title: "Серия добавлена" });
  };

  const deleteEpisode = async (id: string) => {
    await supabase.from("episodes").delete().eq("id", id);
    if (epMovie) {
      const { data } = await supabase.from("episodes").select("*").eq("movie_id", epMovie.id).order("part_number");
      setEpisodes((data || []) as Episode[]);
    }
    toast({ title: "Серия удалена", variant: "destructive" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Управление фильмами
        </h2>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Добавить фильм
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск фильмов..." className="pl-9 bg-secondary border-border" />
      </div>

      <Card className="bg-gradient-card border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Постер</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Название</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Год</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Рейтинг</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <img src={m.poster} alt={m.title} className="h-12 w-8 rounded object-cover" />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{m.title}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{m.year}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-accent font-semibold">★ {m.rating}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEpisodes(m)} title="Серии">
                          <ListVideo className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Movie Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{editMovie ? "Редактировать фильм" : "Добавить фильм"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>Название</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Год</Label>
                <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="grid gap-2">
                <Label>Рейтинг</Label>
                <Input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="grid gap-2">
                <Label>Длит.</Label>
                <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Жанры (через запятую)</Label>
              <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="grid gap-2">
              <Label>Постер (загрузить из галереи)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPosterFile(file);
                }}
                className="bg-secondary border-border"
              />
              {(posterFile || form.poster) && (
                <img
                  src={posterFile ? URL.createObjectURL(posterFile) : form.poster}
                  alt="Превью"
                  className="h-24 w-16 rounded object-cover"
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label>URL трейлера (YouTube embed)</Label>
              <Input value={form.trailer_url} onChange={(e) => setForm({ ...form, trailer_url: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="grid gap-2">
              <Label>Описание</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" rows={3} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              <Label>В слайдере на главной</Label>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editMovie ? "Сохранить" : "Добавить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Episodes Dialog */}
      <Dialog open={epOpen} onOpenChange={setEpOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Серии: {epMovie?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {episodes.map((ep) => (
              <div key={ep.id} className="rounded-lg bg-secondary/50 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Часть {ep.part_number}: {ep.title}</p>
                    <p className="text-xs text-muted-foreground">{ep.is_free ? "Бесплатно" : "VIP"} • {ep.duration || "—"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => deleteEpisode(ep.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {/* Edit episode link inline */}
                <div className="flex gap-2">
                  <Input
                    defaultValue={ep.video_url || ""}
                    placeholder="Ссылка (Telegram/URL)"
                    className="bg-background border-border text-xs h-8 flex-1"
                    onBlur={async (e) => {
                      const newUrl = e.target.value;
                      if (newUrl !== (ep.video_url || "")) {
                        await supabase.from("episodes").update({ video_url: newUrl || null }).eq("id", ep.id);
                        toast({ title: `Часть ${ep.part_number} опубликована ✅` });
                        if (epMovie) {
                          const { data } = await supabase.from("episodes").select("*").eq("movie_id", epMovie.id).order("part_number");
                          setEpisodes((data || []) as Episode[]);
                        }
                      }
                    }}
                  />
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={ep.is_free}
                      onCheckedChange={async (v) => {
                        await supabase.from("episodes").update({ is_free: v }).eq("id", ep.id);
                        if (epMovie) {
                          const { data } = await supabase.from("episodes").select("*").eq("movie_id", epMovie.id).order("part_number");
                          setEpisodes((data || []) as Episode[]);
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{ep.is_free ? "Free" : "VIP"}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">Добавить серию</p>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Номер" value={epForm.part_number} onChange={(e) => setEpForm({ ...epForm, part_number: e.target.value })} className="bg-secondary border-border" />
                <Input placeholder="Название" value={epForm.title} onChange={(e) => setEpForm({ ...epForm, title: e.target.value })} className="bg-secondary border-border" />
              </div>
              <Input placeholder="Ссылка (напр. https://t.me/bot?start=...)" value={epForm.video_url} onChange={(e) => setEpForm({ ...epForm, video_url: e.target.value })} className="bg-secondary border-border" />
              <div className="flex items-center gap-3">
                <Input placeholder="Длительность" value={epForm.duration} onChange={(e) => setEpForm({ ...epForm, duration: e.target.value })} className="bg-secondary border-border flex-1" />
                <div className="flex items-center gap-2">
                  <Switch checked={epForm.is_free} onCheckedChange={(v) => setEpForm({ ...epForm, is_free: v })} />
                  <span className="text-xs text-muted-foreground">Бесплатно</span>
                </div>
              </div>
              <Button onClick={addEpisode} className="w-full" size="sm">Добавить серию</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoviesAdmin;
