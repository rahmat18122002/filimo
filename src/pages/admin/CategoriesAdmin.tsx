import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, GripVertical, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", name_en: "", name_tg: "", name_fa: "", sort_order: "0", is_active: true });

  // Carousel speed
  const [carouselSpeed, setCarouselSpeed] = useState("5");
  const [savingSpeed, setSavingSpeed] = useState(false);

  const load = () => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
    supabase.from("app_settings").select("*").eq("key", "carousel_speed").single().then(({ data }) => {
      if (data) setCarouselSpeed((data as any).value);
    });
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ name: "", name_en: "", name_tg: "", name_fa: "", sort_order: String(categories.length), is_active: true });
  };

  const openEdit = (c: any) => {
    setEditCat(c);
    setForm({ name: c.name, name_en: c.name_en || "", name_tg: c.name_tg || "", name_fa: c.name_fa || "", sort_order: String(c.sort_order), is_active: c.is_active });
    setIsOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      name_en: form.name_en.trim(),
      name_tg: form.name_tg.trim(),
      name_fa: form.name_fa.trim(),
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    if (!payload.name) return toast({ title: "Введите название", variant: "destructive" });

    if (editCat) {
      await supabase.from("categories").update(payload).eq("id", editCat.id);
      toast({ title: "Категория обновлена" });
    } else {
      await supabase.from("categories").insert(payload);
      toast({ title: "Категория добавлена" });
    }
    setIsOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    toast({ title: "Категория удалена", variant: "destructive" });
    load();
  };

  const saveSpeed = async () => {
    setSavingSpeed(true);
    await supabase.from("app_settings").update({ value: carouselSpeed }).eq("key", "carousel_speed");
    setSavingSpeed(false);
    toast({ title: "Скорость карусели сохранена" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Управление категориями
        </h2>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Добавить категорию
        </Button>
      </div>

      {/* Carousel speed setting */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-foreground mb-3">⏱ Скорость автопрокрутки карусели (секунды)</p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="0"
              max="60"
              value={carouselSpeed}
              onChange={(e) => setCarouselSpeed(e.target.value)}
              className="bg-secondary border-border w-24"
            />
            <span className="text-xs text-muted-foreground">0 = отключить автопрокрутку</span>
            <Button onClick={saveSpeed} disabled={savingSpeed} size="sm" className="gap-2 ml-auto">
              <Save className="h-4 w-4" />
              Сохранить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories list */}
      <Card className="bg-gradient-card border-border overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Порядок</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Название</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Статус</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 text-muted-foreground">{c.sort_order}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {c.is_active ? "Активна" : "Скрыта"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Нет категорий</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>{editCat ? "Редактировать категорию" : "Добавить категорию"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Название</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="grid gap-2">
              <Label>Порядок сортировки</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Активна</Label>
            </div>
            <Button onClick={handleSave} className="w-full">{editCat ? "Сохранить" : "Добавить"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesAdmin;
