import { useState } from "react";
import { Film, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { movies as initialMovies, type Movie } from "@/data/movies";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const MoviesAdmin = () => {
  const [movieList, setMovieList] = useState<Movie[]>(initialMovies);
  const [search, setSearch] = useState("");
  const [editMovie, setEditMovie] = useState<Movie | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: "", year: "", rating: "", genre: "", description: "", poster: "", duration: "" });

  const filtered = movieList.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditMovie(null);
    setForm({ title: "", year: "", rating: "", genre: "", description: "", poster: "", duration: "" });
    setIsOpen(true);
  };

  const openEdit = (m: Movie) => {
    setEditMovie(m);
    setForm({
      title: m.title,
      year: String(m.year),
      rating: String(m.rating),
      genre: m.genre.join(", "),
      description: m.description,
      poster: m.poster,
      duration: m.duration,
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    const movie: Movie = {
      id: editMovie?.id ?? Date.now(),
      title: form.title,
      year: Number(form.year),
      rating: Number(form.rating),
      genre: form.genre.split(",").map((g) => g.trim()),
      description: form.description,
      poster: form.poster,
      duration: form.duration,
    };

    if (editMovie) {
      setMovieList((prev) => prev.map((m) => (m.id === editMovie.id ? movie : m)));
      toast({ title: "Фильм обновлён" });
    } else {
      setMovieList((prev) => [...prev, movie]);
      toast({ title: "Фильм добавлен" });
    }
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    setMovieList((prev) => prev.filter((m) => m.id !== id));
    toast({ title: "Фильм удалён", variant: "destructive" });
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск фильмов..."
          className="pl-9 bg-secondary border-border"
        />
      </div>

      {/* Table */}
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Жанры</th>
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
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {m.genre.slice(0, 2).map((g) => (
                          <span key={g} className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{g}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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

      {/* Edit/Create Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{editMovie ? "Редактировать фильм" : "Добавить фильм"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
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
              <Label>URL постера</Label>
              <Input value={form.poster} onChange={(e) => setForm({ ...form, poster: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="grid gap-2">
              <Label>Описание</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" rows={3} />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editMovie ? "Сохранить" : "Добавить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoviesAdmin;
