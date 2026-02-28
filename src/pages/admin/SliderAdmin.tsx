import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SliderItem {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  movie_id: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Movie {
  id: string;
  title: string;
}

const SliderAdmin = () => {
  const [items, setItems] = useState<SliderItem[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [movieId, setMovieId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchItems = async () => {
    const { data } = await supabase
      .from("slider_items")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setItems(data);
  };

  const fetchMovies = async () => {
    const { data } = await supabase
      .from("movies")
      .select("id, title")
      .order("title");
    if (data) setMovies(data);
  };

  useEffect(() => {
    fetchItems();
    fetchMovies();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdd = async () => {
    if (!title.trim() || !imageFile) {
      toast({ title: "Заполните название и выберите изображение", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const ext = imageFile.name.split(".").pop();
      const fileName = `slider_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("posters")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("posters")
        .getPublicUrl(fileName);

      const { error } = await supabase.from("slider_items").insert({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        image_url: urlData.publicUrl,
        movie_id: movieId || null,
        sort_order: items.length,
      });

      if (error) throw error;

      toast({ title: "Слайд добавлен ✅" });
      setTitle("");
      setSubtitle("");
      setMovieId("");
      setImageFile(null);
      setImagePreview("");
      fetchItems();
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("slider_items").delete().eq("id", id);
    toast({ title: "Слайд удалён 🗑️" });
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Управление слайдером</h2>

      {/* Add form */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Заголовок *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название слайда"
              />
            </div>
            <div className="space-y-2">
              <Label>Подзаголовок</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Описание (необязательно)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Изображение *</Label>
              <Input type="file" accept="image/*" onChange={handleFileChange} />
              {imagePreview && (
                <img src={imagePreview} alt="preview" className="h-24 rounded-lg object-cover" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Привязать к фильму</Label>
              <Select value={movieId} onValueChange={setMovieId}>
                <SelectTrigger>
                  <SelectValue placeholder="Без привязки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без привязки</SelectItem>
                  {movies.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAdd} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Загрузка..." : "Добавить слайд"}
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Слайдов пока нет</p>
        )}
        {items.map((item, idx) => (
          <Card key={item.id} className="border-border bg-card">
            <CardContent className="flex items-center gap-4 py-4">
              <span className="text-muted-foreground font-mono text-sm w-6">
                {idx + 1}
              </span>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-16 w-28 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="h-16 w-28 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SliderAdmin;
