import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Story {
  id: string;
  title: string;
  image_url: string;
  video_url: string | null;
  movie_id: string | null;
  is_active: boolean;
  sort_order: number;
}

const StoriesAdmin = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", image_url: "", movie_id: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchStories(); }, []);

  const fetchStories = async () => {
    setLoading(true);
    const { data } = await supabase.from("stories").select("*").order("sort_order");
    setStories((data as Story[]) || []);
    setLoading(false);
  };

  const addStory = async () => {
    if (!form.title) {
      toast({ title: "Введите название", variant: "destructive" });
      return;
    }
    if (!imageFile && !form.image_url) {
      toast({ title: "Загрузите изображение или укажите URL", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("stories").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("stories").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const { error: insertError } = await supabase.from("stories").insert({
        title: form.title,
        image_url: imageUrl,
        movie_id: form.movie_id || null,
        sort_order: stories.length,
      });
      if (insertError) throw insertError;
      setForm({ title: "", image_url: "", movie_id: "" });
      setImageFile(null);
      fetchStories();
      toast({ title: "Стори добавлена ✅" });
    } catch (e: any) {
      console.error("Story add error:", e);
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("stories").update({ is_active: active }).eq("id", id);
    fetchStories();
  };

  const deleteStory = async (id: string) => {
    await supabase.from("stories").delete().eq("id", id);
    fetchStories();
    toast({ title: "Стори удалена" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        Управление Stories
      </h2>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" /> Добавить стори
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Название</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Новый фильм!" />
            </div>
            <div>
              <Label>ID фильма (опционально)</Label>
              <Input value={form.movie_id} onChange={(e) => setForm({ ...form, movie_id: e.target.value })} placeholder="uuid фильма для перехода" />
            </div>
            <div>
              <Label>Изображение (загрузить)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Или URL изображения</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <Button onClick={addStory} disabled={uploading} className="gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Добавить
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Загрузка...</p>
      ) : (
        <div className="space-y-3">
          {stories.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-full overflow-hidden shrink-0 bg-secondary">
                  {s.image_url && <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.movie_id ? "Ведёт к фильму" : "Без ссылки"}</p>
                </div>
                <Switch checked={s.is_active} onCheckedChange={(v) => toggleActive(s.id, v)} />
                <Button variant="ghost" size="icon" onClick={() => deleteStory(s.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoriesAdmin;
