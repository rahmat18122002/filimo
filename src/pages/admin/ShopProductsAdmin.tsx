import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Upload, Loader2, ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  in_stock: boolean;
  is_active: boolean;
  category_id: string | null;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const ShopProductsAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ title: "", description: "", price: 0, category_id: "", in_stock: true, image_url: "", sort_order: 0 });
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    supabase.from("shop_products").select("*").order("sort_order").then(({ data }) => {
      if (data) setProducts(data as Product[]);
    });
    supabase.from("shop_categories").select("*").order("sort_order").then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("shop").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("shop").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
    }
    setUploading(false);
  };

  const save = async () => {
    if (!form.title.trim()) { toast({ title: "Введите название", variant: "destructive" }); return; }
    const payload = {
      title: form.title,
      description: form.description,
      price: form.price,
      category_id: form.category_id || null,
      in_stock: form.in_stock,
      image_url: form.image_url,
      sort_order: form.sort_order,
    };
    if (editing) {
      await supabase.from("shop_products").update(payload).eq("id", editing.id);
      toast({ title: "Товар обновлён" });
    } else {
      await supabase.from("shop_products").insert(payload);
      toast({ title: "Товар добавлен" });
    }
    setEditing(null);
    setShowForm(false);
    setForm({ title: "", description: "", price: 0, category_id: "", in_stock: true, image_url: "", sort_order: 0 });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("shop_products").delete().eq("id", id);
    toast({ title: "Товар удалён" });
    load();
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description, price: p.price, category_id: p.category_id || "", in_stock: p.in_stock, image_url: p.image_url, sort_order: p.sort_order });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Товары</h2>
        <Button onClick={() => { setEditing(null); setForm({ title: "", description: "", price: 0, category_id: "", in_stock: true, image_url: "", sort_order: 0 }); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Добавить
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <Input placeholder="Название" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input placeholder="Описание" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Input type="number" placeholder="Цена" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
          <select
            value={form.category_id}
            onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Категория —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.in_stock} onChange={e => setForm(f => ({ ...f, in_stock: e.target.checked }))} />
              В наличии
            </label>
            <Input type="number" placeholder="Порядок" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="w-24" />
          </div>
          {/* Image */}
          <div className="flex items-center gap-3">
            {form.image_url && <img src={form.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
            <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleUpload} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Фото
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={save}>{editing ? "Сохранить" : "Добавить"}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-full w-full p-2 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.price} сом. · {p.in_stock ? "✅" : "❌"}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopProductsAdmin;
