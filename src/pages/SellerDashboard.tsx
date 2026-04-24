import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, Package, ClipboardList, Plus, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface Seller {
  id: string;
  shop_name: string;
  is_active: boolean;
  subscription_until: string | null;
  description: string;
  phone: string;
  whatsapp: string;
  logo_url: string;
}
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  in_stock: boolean;
  is_active: boolean;
  category_id: string | null;
  view_count: number;
}
interface Category { id: string; name: string; icon: string }
interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  screenshot_url: string | null;
}

const getDeviceId = () => localStorage.getItem("kino_device_id") || "";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Product editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pCategory, setPCategory] = useState<string>("");
  const [pInStock, setPInStock] = useState(true);
  const [pImageFile, setPImageFile] = useState<File | null>(null);
  const [pImageUrl, setPImageUrl] = useState("");

  // Profile editor
  const [profileShopName, setProfileShopName] = useState("");
  const [profileDesc, setProfileDesc] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileWhatsapp, setProfileWhatsapp] = useState("");
  const [profileLogo, setProfileLogo] = useState<File | null>(null);

  const load = async () => {
    const deviceId = getDeviceId();
    const { data: sellerData } = await supabase.from("shop_sellers").select("*").eq("device_id", deviceId).maybeSingle();
    if (!sellerData) {
      navigate("/seller");
      return;
    }
    const s = sellerData as Seller;
    if (!s.is_active || !s.subscription_until || new Date(s.subscription_until) <= new Date()) {
      navigate("/seller");
      return;
    }
    setSeller(s);
    setProfileShopName(s.shop_name);
    setProfileDesc(s.description);
    setProfilePhone(s.phone);
    setProfileWhatsapp(s.whatsapp);

    const [{ data: prods }, { data: ords }, { data: cats }] = await Promise.all([
      supabase.from("shop_products").select("*").eq("seller_id", s.id).order("created_at", { ascending: false }),
      supabase.from("shop_orders").select("*").eq("seller_id", s.id).order("created_at", { ascending: false }),
      supabase.from("shop_categories").select("*").eq("is_active", true).order("sort_order"),
    ]);
    if (prods) setProducts(prods as Product[]);
    if (ords) setOrders(ords as Order[]);
    if (cats) setCategories(cats as Category[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("shop").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("shop").getPublicUrl(path).data.publicUrl;
  };

  const openNewProduct = () => {
    setEditingId(null);
    setPTitle(""); setPDesc(""); setPPrice(""); setPCategory("");
    setPInStock(true); setPImageFile(null); setPImageUrl("");
    setEditorOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingId(p.id);
    setPTitle(p.title); setPDesc(p.description); setPPrice(String(p.price));
    setPCategory(p.category_id || ""); setPInStock(p.in_stock);
    setPImageFile(null); setPImageUrl(p.image_url);
    setEditorOpen(true);
  };

  const saveProduct = async () => {
    if (!seller || !pTitle.trim() || !pPrice) {
      toast({ title: "Заполните название и цену", variant: "destructive" });
      return;
    }
    try {
      let imageUrl = pImageUrl;
      if (pImageFile) imageUrl = await uploadFile(pImageFile, "products");

      const payload = {
        title: pTitle.trim(),
        description: pDesc.trim(),
        price: parseInt(pPrice) || 0,
        category_id: pCategory || null,
        in_stock: pInStock,
        image_url: imageUrl,
        seller_id: seller.id,
      };

      if (editingId) {
        await supabase.from("shop_products").update(payload).eq("id", editingId);
      } else {
        await supabase.from("shop_products").insert(payload);
      }
      toast({ title: "Сохранено" });
      setEditorOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("shop_products").delete().eq("id", id);
    toast({ title: "Удалено" });
    load();
  };

  const setOrderStatus = async (id: string, status: string) => {
    await supabase.from("shop_orders").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Статус обновлён" });
    load();
  };

  const saveProfile = async () => {
    if (!seller) return;
    let logoUrl = seller.logo_url;
    if (profileLogo) logoUrl = await uploadFile(profileLogo, "sellers/logos");
    await supabase.from("shop_sellers").update({
      shop_name: profileShopName.trim(),
      description: profileDesc.trim(),
      phone: profilePhone.trim(),
      whatsapp: profileWhatsapp.trim(),
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    }).eq("id", seller.id);
    toast({ title: "Профиль обновлён" });
    load();
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Загрузка...</div>;
  if (!seller) return null;

  const totalRevenue = orders.filter(o => o.status === "confirmed").reduce((s, o) => s + o.total_amount, 0);
  const totalViews = products.reduce((s, p) => s + p.view_count, 0);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/shop")}><ArrowLeft className="h-5 w-5" /></Button>
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-base font-bold truncate">{seller.shop_name}</h1>
          <Badge variant="outline" className="ml-auto text-xs">До {new Date(seller.subscription_until!).toLocaleDateString("ru-RU")}</Badge>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-4">
        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Товаров</p>
            <p className="text-xl font-bold">{products.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Заказов</p>
            <p className="text-xl font-bold">{orders.length}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Доход</p>
            <p className="text-xl font-bold text-primary">{totalRevenue}</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products"><Package className="mr-1 h-4 w-4" />Товары</TabsTrigger>
            <TabsTrigger value="orders"><ClipboardList className="mr-1 h-4 w-4" />Заказы</TabsTrigger>
            <TabsTrigger value="profile"><Store className="mr-1 h-4 w-4" />Профиль</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-3">
            <Button onClick={openNewProduct} className="w-full"><Plus className="mr-2 h-4 w-4" />Добавить товар</Button>
            {products.map(p => (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  {p.image_url ? (
                    <img src={p.image_url} className="h-14 w-14 rounded-lg object-cover" alt={p.title} />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-sm font-bold text-primary">{p.price} сом.</p>
                    <p className="text-xs text-muted-foreground">👁 {p.view_count} {p.in_stock ? "" : "• Нет в наличии"}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => openEditProduct(p)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </CardContent>
              </Card>
            ))}
            {products.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Товаров пока нет</p>}
          </TabsContent>

          <TabsContent value="orders" className="space-y-3">
            {orders.map(o => (
              <Card key={o.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{o.customer_name}</p>
                    <Badge variant={o.status === "confirmed" ? "default" : o.status === "rejected" ? "destructive" : "secondary"}>
                      {o.status === "pending" ? "Ожидает" : o.status === "confirmed" ? "Подтверждён" : "Отклонён"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{o.customer_phone}</p>
                  <p className="text-sm">{o.customer_address}</p>
                  <p className="font-bold text-primary">{o.total_amount} сом.</p>
                  {o.screenshot_url && (
                    <a href={o.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Скриншот оплаты</a>
                  )}
                  {o.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1" onClick={() => setOrderStatus(o.id, "confirmed")}>Подтвердить</Button>
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => setOrderStatus(o.id, "rejected")}>Отклонить</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {orders.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Заказов пока нет</p>}
          </TabsContent>

          <TabsContent value="profile">
            <Card><CardContent className="space-y-3 p-5">
              <div><Label>Название</Label><Input value={profileShopName} onChange={(e) => setProfileShopName(e.target.value)} /></div>
              <div><Label>Описание</Label><Textarea value={profileDesc} onChange={(e) => setProfileDesc(e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Телефон</Label><Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} /></div>
                <div><Label>WhatsApp</Label><Input value={profileWhatsapp} onChange={(e) => setProfileWhatsapp(e.target.value)} /></div>
              </div>
              <div><Label>Логотип</Label><Input type="file" accept="image/*" onChange={(e) => setProfileLogo(e.target.files?.[0] || null)} /></div>
              <Button onClick={saveProfile} className="w-full">Сохранить</Button>
              <p className="pt-2 text-center text-xs text-muted-foreground">Просмотры товаров: {totalViews}</p>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Редактировать" : "Новый товар"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Название *</Label><Input value={pTitle} onChange={(e) => setPTitle(e.target.value)} maxLength={100} /></div>
            <div><Label>Описание</Label><Textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={3} maxLength={1000} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Цена (сом) *</Label><Input type="number" value={pPrice} onChange={(e) => setPPrice(e.target.value)} /></div>
              <div>
                <Label>Категория</Label>
                <Select value={pCategory} onValueChange={setPCategory}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>В наличии</Label>
              <Switch checked={pInStock} onCheckedChange={setPInStock} />
            </div>
            <div>
              <Label>Фото товара</Label>
              {pImageUrl && <img src={pImageUrl} className="my-2 h-24 w-24 rounded object-cover" alt="preview" />}
              <Input type="file" accept="image/*" onChange={(e) => setPImageFile(e.target.files?.[0] || null)} />
            </div>
            <Button onClick={saveProduct} className="w-full">Сохранить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerDashboard;
